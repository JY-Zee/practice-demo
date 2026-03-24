/**
 * Vue 3.6 Alien Signals 核心实现
 *
 * 与 Vue 3.5 及之前版本的核心区别：
 * - 旧版：用 Set<Effect> 存储依赖，内存占用高，GC 压力大
 * - 新版：用「双向链表」存储依赖关系，节省内存，追踪更高效
 *
 * 核心设计：Push-Pull 混合模型
 * - Push（推送）：当 signal 变化时，向下游 effect/computed 推送"脏"标记
 * - Pull（拉取）：effect 执行时，才真正拉取 computed 的最新值（懒计算）
 *
 * 关键数据结构：Link（链接节点）
 * 每个 Link 代表一条「依赖->订阅者」的边，通过四个指针形成两个双向链表：
 *   - prevDep / nextDep：同一 subscriber 的所有依赖，横向链表
 *   - prevSub / nextSub：同一 dep 的所有订阅者，纵向链表
 */

// ============================================================
// 全局状态
// ============================================================

/**
 * 当前正在执行的 effect/computed，用于依赖收集
 * 类似 Vue 3.5 的 activeEffect，但这里直接存储 Subscriber 对象
 */
let activeSub = null;

/**
 * 批量更新队列深度计数器
 * > 0 时处于批量模式，effect 不会立即执行，而是排队
 */
let batchDepth = 0;

/**
 * 待执行的 effect 队列（单向链表头部）
 * 批量模式结束后统一 flush
 */
let batchedEffect = null;

/**
 * 全局版本号，每次 signal 写入时递增
 * 用于快速判断 computed 是否需要重新计算
 */
let globalVersion = 0;

// ============================================================
// 枚举：Subscriber 的脏状态
// ============================================================

/**
 * SubscriberFlags - 订阅者的状态标记位
 *
 * 使用位运算可以同时存储多个状态（参考 Vue 源码 SubscriberFlags）
 */
export const SubscriberFlags = {
  /** 无任何状态 */
  None: 0,
  /**
   * Tracking（追踪中）
   * 当 subscriber 正在执行时置位，表示此时读到的依赖需要被收集
   */
  Tracking: 1 << 0, // 0001
  /**
   * Dirty（确定脏）
   * 依赖的 signal 已改变，subscriber 必须重新计算
   */
  Dirty: 1 << 1, // 0010
  /**
   * PendingComputed（待确认脏）
   * 上游某个 computed 可能改变，需要先检查它，才能确认自己是否脏
   * 这是 alien-signals 相比旧版的关键优化：避免不必要的重新计算
   */
  PendingComputed: 1 << 2, // 0100
  /**
   * PendingEffect（待执行 effect）
   * 已被加入批量队列，等待 flush
   */
  PendingEffect: 1 << 3, // 1000
};

// ============================================================
// Link 节点（双向链表核心）
// ============================================================

/**
 * 创建一个 Link 节点，连接 dep（依赖）和 sub（订阅者）
 *
 * 每个 Link 节点同时存在于两个双向链表中：
 * 1. dep.subs 链表（纵向）：该 dep 的所有订阅者
 *    - prevSub：链表中上一个订阅了该 dep 的 link
 *    - nextSub：链表中下一个订阅了该 dep 的 link
 *
 * 2. sub.deps 链表（横向）：该 sub 依赖的所有 dep
 *    - prevDep：该 sub 的上一个依赖 link
 *    - nextDep：该 sub 的下一个依赖 link
 *
 * 内存布局示意：
 *
 *   dep1.subsTail ──► Link(dep1,effA) ◄──► Link(dep1,effB)
 *                         │                      │
 *                       nextDep                nextDep
 *                         ▼                      ▼
 *                    Link(dep2,effA)        Link(dep3,effB)
 *
 * @param {object} dep - 依赖对象（Signal 或 Computed）
 * @param {object} sub - 订阅者对象（Effect 或 Computed）
 */
function createLink(dep, sub) {
  return {
    dep,       // 被依赖的对象
    sub,       // 订阅者对象
    // dep.subs 链表指针
    prevSub: null,
    nextSub: null,
    // sub.deps 链表指针
    prevDep: null,
    nextDep: null,
    // 用于依赖版本对比，判断该 link 是否在本次追踪中被访问过
    // 对应 Vue 源码中的 trackId / version
    version: 0,
  };
}

// ============================================================
// 依赖追踪核心函数
// ============================================================

/**
 * 将 dep 与当前 activeSub 建立链接（依赖收集）
 *
 * 优化点：使用「Link 复用」机制
 * - 如果该 dep-sub 之间的 link 已存在且在本次追踪中已记录，直接跳过
 * - 避免重复分配 Link 对象，减少 GC 压力
 *
 * @param {object} dep - 被追踪的依赖（Signal/Computed）
 */
export function track(dep) {
  if (!activeSub || !(activeSub.flags & SubscriberFlags.Tracking)) return;

  const sub = activeSub;

  // 检查 sub 当前尾部 link 是否已经指向此 dep
  // 如果是，说明本次执行中已经追踪过，直接复用
  const currentTail = sub.depsTail;
  if (currentTail && currentTail.dep === dep) {
    return; // 已追踪，跳过
  }

  // 查找是否存在可复用的旧 link（dep-sub 组合相同）
  // 遍历该 sub 的依赖链表，找到对应 dep 的 link
  let link = dep.subsTail;
  while (link) {
    if (link.sub === sub) {
      // 找到可复用的 link，将其移到 sub.deps 链表尾部
      moveToTail(sub, link);
      return;
    }
    link = link.prevSub;
  }

  // 没有可复用的 link，创建新的
  link = createLink(dep, sub);

  // 将新 link 加入 dep.subs 链表（尾插）
  if (!dep.subs) {
    dep.subs = link;
    dep.subsTail = link;
  } else {
    link.prevSub = dep.subsTail;
    dep.subsTail.nextSub = link;
    dep.subsTail = link;
  }

  // 将新 link 加入 sub.deps 链表（尾插）
  if (!sub.deps) {
    sub.deps = link;
    sub.depsTail = link;
  } else {
    link.prevDep = sub.depsTail;
    sub.depsTail.nextDep = link;
    sub.depsTail = link;
  }
}

/**
 * 将 link 移到 sub.deps 链表的尾部（复用时调整顺序）
 * 保证链表顺序与依赖访问顺序一致，便于后续清理失效依赖
 */
function moveToTail(sub, link) {
  if (link === sub.depsTail) return; // 已在尾部

  // 从当前位置摘出
  if (link.prevDep) link.prevDep.nextDep = link.nextDep;
  else sub.deps = link.nextDep;
  if (link.nextDep) link.nextDep.prevDep = link.prevDep;

  // 插入尾部
  link.prevDep = sub.depsTail;
  link.nextDep = null;
  if (sub.depsTail) sub.depsTail.nextDep = link;
  sub.depsTail = link;
}

/**
 * 清理本次追踪结束后，sub 中不再使用的旧依赖 link
 *
 * 时机：effect 执行完毕后调用
 * 原理：sub.depsTail 之后的 link 都是旧的、本次未访问的依赖，需要断开
 *
 * @param {object} sub - 订阅者
 * @param {object|null} newTail - 本次追踪结束时的 depsTail
 */
export function cleanupDeps(sub, newTail) {
  // 找到 newTail 之后的所有旧 link 并从 dep.subs 链表中移除
  let link = sub.depsTail;
  while (link && link !== newTail) {
    const toRemove = link;
    link = link.prevDep;
    removeLinkFromDep(toRemove);
  }
  sub.depsTail = newTail;
  if (newTail) {
    newTail.nextDep = null;
  } else {
    sub.deps = null;
  }
}

/**
 * 将 link 从其 dep 的 subs 链表中移除
 */
function removeLinkFromDep(link) {
  const dep = link.dep;
  if (link.prevSub) link.prevSub.nextSub = link.nextSub;
  else dep.subs = link.nextSub;
  if (link.nextSub) link.nextSub.prevSub = link.prevSub;
  else dep.subsTail = link.prevSub;
}

// ============================================================
// 触发传播（向下游推送脏标记）
// ============================================================

/**
 * 当 dep 的值发生变化时，通知所有订阅者
 *
 * 这是 Push 阶段的核心：向下游传播「脏」信号
 * - 对直接 effect：标记为 Dirty，加入批量队列
 * - 对 computed：标记为 Dirty 或 PendingComputed，并继续向其下游传播
 *
 * @param {object} dep - 发生变化的依赖对象
 */
export function propagate(dep) {
  let link = dep.subs;
  while (link) {
    const sub = link.sub;
    const subFlags = sub.flags;

    if (
      !(subFlags & (SubscriberFlags.Dirty | SubscriberFlags.PendingEffect))
    ) {
      // 根据 sub 类型决定如何标记
      if (sub instanceof ComputedImpl) {
        // computed 先标记为 Dirty，并继续向其订阅者传播 PendingComputed
        sub.flags |= SubscriberFlags.Dirty;
        // 向 computed 的下游继续传播（变为 PendingComputed，表示"可能脏"）
        propagateComputed(sub);
      } else {
        // 普通 effect，直接标记为 Dirty 并加入批量队列
        sub.flags |= SubscriberFlags.Dirty | SubscriberFlags.PendingEffect;
        schedulEffect(sub);
      }
    }

    link = link.nextSub;
  }
}

/**
 * 向 computed 的下游传播 PendingComputed 标记（懒传播）
 *
 * PendingComputed 含义：上游某个 computed 可能已变化，
 * 但需要等到真正读取值时才去验证（Pull 阶段）。
 * 这避免了链式 computed 场景下不必要的重新计算。
 *
 * @param {ComputedImpl} computed
 */
function propagateComputed(computed) {
  let link = computed.subs;
  while (link) {
    const sub = link.sub;
    if (!(sub.flags & (SubscriberFlags.Dirty | SubscriberFlags.PendingComputed))) {
      sub.flags |= SubscriberFlags.PendingComputed;
      if (sub instanceof ComputedImpl) {
        // 继续向下游传播
        propagateComputed(sub);
      } else {
        // effect 节点也需要加入调度队列（但不是 Dirty，等确认后再执行）
        if (!(sub.flags & SubscriberFlags.PendingEffect)) {
          sub.flags |= SubscriberFlags.PendingEffect;
          schedulEffect(sub);
        }
      }
    }
    link = link.nextSub;
  }
}

// ============================================================
// 批量调度
// ============================================================

/**
 * 将 effect 加入批量执行队列（单向链表）
 */
function schedulEffect(effect) {
  // 用 nextBatchEffect 指针串成单向链表
  effect.nextBatchEffect = batchedEffect;
  batchedEffect = effect;
}

/**
 * 开始批量模式，期间 effect 不会立即执行
 * 对应 Vue 的 pauseTracking + startBatch
 */
export function startBatch() {
  batchDepth++;
}

/**
 * 结束批量模式，如果深度归零则 flush 所有待执行 effect
 */
export function endBatch() {
  batchDepth--;
  if (batchDepth === 0) {
    flushBatch();
  }
}

/**
 * 执行所有批量队列中的 effect
 *
 * 执行前会检查 effect 是否真的脏（Pull 阶段验证）
 * 避免因 PendingComputed 误判导致不必要的执行
 */
function flushBatch() {
  while (batchedEffect) {
    const effect = batchedEffect;
    batchedEffect = effect.nextBatchEffect;
    effect.nextBatchEffect = null;

    // 检查 effect 是否真的需要运行
    if (effect.flags & SubscriberFlags.PendingEffect) {
      effect.flags &= ~SubscriberFlags.PendingEffect;

      // 如果是 PendingComputed（不确定是否脏），需要先验证上游 computed
      if (checkDirty(effect)) {
        effect.run();
      } else {
        // 上游 computed 实际没有变化，清除脏标记
        effect.flags &= ~SubscriberFlags.Dirty;
      }
    }
  }
}

/**
 * Pull 阶段：检查 subscriber 是否真的脏
 *
 * 当 subscriber 带有 PendingComputed 标记时，
 * 需要遍历其依赖中的 computed，确认它们是否真的重新计算并改变了值。
 * 如果所有上游 computed 的值都没变，则该 subscriber 不需要重新执行。
 *
 * @param {object} sub
 * @returns {boolean} 是否真的脏
 */
function checkDirty(sub) {
  if (sub.flags & SubscriberFlags.Dirty) return true;
  if (!(sub.flags & SubscriberFlags.PendingComputed)) return false;

  // 遍历所有依赖，检查其中的 computed 是否真的改变了
  let link = sub.deps;
  while (link) {
    const dep = link.dep;
    if (dep instanceof ComputedImpl) {
      if (checkDirty(dep)) {
        // 触发 computed 重新计算，并检查值是否真的变化
        dep.get(); // 内部会更新 dep 并清除 Dirty
        if (sub.flags & SubscriberFlags.Dirty) {
          // computed 通知了 sub 变脏（通过 propagate），确认脏
          return true;
        }
      }
    }
    link = link.nextDep;
  }

  // 所有上游 computed 都没有实际改变，sub 不需要重新执行
  sub.flags &= ~SubscriberFlags.PendingComputed;
  return false;
}

// ============================================================
// Signal（响应式信号）
// ============================================================

/**
 * Signal 是最基础的响应式原语，类似 Vue 的 ref
 *
 * 与旧版 ref 的差异：
 * - 旧版：内部用 Set<ReactiveEffect> 存订阅者
 * - 新版：内部用双向链表 (subs/subsTail) 存订阅者
 */
class SignalImpl {
  constructor(value) {
    this._value = value;
    /** dep 的订阅者链表（头部），存储所有依赖此 signal 的 Link */
    this.subs = null;
    /** dep 的订阅者链表（尾部），用于 O(1) 尾插 */
    this.subsTail = null;
    /** 当前 signal 的版本号，每次写入时递增，用于 computed 的 Pull 验证 */
    this.version = globalVersion;
  }

  /** 读取值，同时触发依赖追踪 */
  get value() {
    track(this); // 如果有 activeSub，建立 dep->sub 链接
    return this._value;
  }

  /** 写入值，触发下游传播 */
  set value(newVal) {
    if (newVal !== this._value) {
      this._value = newVal;
      this.version = ++globalVersion; // 版本号递增
      propagate(this);               // 向订阅者推送脏标记
      if (batchDepth === 0) {
        flushBatch();                // 非批量模式立即 flush
      }
    }
  }
}

/**
 * 创建一个 Signal（响应式信号）
 * @param {any} initialValue
 * @returns {SignalImpl}
 */
export function signal(initialValue) {
  return new SignalImpl(initialValue);
}

// ============================================================
// Computed（懒计算信号）
// ============================================================

/**
 * ComputedImpl 既是 Subscriber（依赖上游 signal/computed）
 * 又是 Dep（被下游 effect/computed 依赖）
 *
 * 关键特性：懒计算
 * - 不会在依赖变化时立即重新计算
 * - 只有被读取时（Pull）才验证并更新
 *
 * 与旧版 computed 的差异：
 * - 旧版：每次 dep 变化就标记脏，下次读时重算（基本一致）
 * - 新版：通过 PendingComputed 传播，允许跳过无效的重计算链
 */
export class ComputedImpl {
  constructor(getter) {
    this._getter = getter;
    this._value = undefined;

    // === 作为 Dep 的属性（被下游依赖）===
    this.subs = null;
    this.subsTail = null;
    this.version = -1; // 初始设为 -1，保证第一次读取时一定计算

    // === 作为 Subscriber 的属性（依赖上游）===
    this.deps = null;
    this.depsTail = null;
    /** 状态标记：Tracking | Dirty | PendingComputed */
    this.flags = SubscriberFlags.Dirty; // 初始为 Dirty，第一次读取时计算

    this.nextBatchEffect = null; // 批量队列指针（computed 一般不用，但结构兼容）
  }

  /** 读取 computed 值（Pull 入口） */
  get value() {
    track(this); // 收集当前 computed 作为依赖
    if (this.flags & (SubscriberFlags.Dirty | SubscriberFlags.PendingComputed)) {
      this.get(); // 按需重新计算
    }
    return this._value;
  }

  /**
   * 真正执行 getter，更新 _value
   * 如果新旧值不同，向下游传播
   */
  get() {
    // 执行前清理旧依赖，重新收集
    cleanupDeps(this, null);

    const prevSub = activeSub;

    // 开始追踪：设置 activeSub 为自身，标记 Tracking
    activeSub = this;
    this.flags = (this.flags & ~(SubscriberFlags.Dirty | SubscriberFlags.PendingComputed)) | SubscriberFlags.Tracking;

    let newValue;
    try {
      newValue = this._getter();
    } finally {
      // 结束追踪：恢复 activeSub
      this.flags &= ~SubscriberFlags.Tracking;
      activeSub = prevSub;
    }

    // 值变化时更新版本并通知下游
    if (newValue !== this._value) {
      this._value = newValue;
      this.version = ++globalVersion;
      propagate(this); // 作为 dep 向下游传播
    }

    // 清除 Dirty/PendingComputed
    this.flags &= ~(SubscriberFlags.Dirty | SubscriberFlags.PendingComputed);
    return this._value;
  }
}

/**
 * 创建一个 Computed
 * @param {Function} getter
 * @returns {ComputedImpl}
 */
export function computed(getter) {
  return new ComputedImpl(getter);
}

// ============================================================
// Effect（副作用）
// ============================================================

/**
 * Effect 是响应式系统的"消费者"，自动追踪依赖并在依赖变化时重新执行
 *
 * 实现要点：
 * 1. 首次执行时收集依赖（通过 activeSub 机制）
 * 2. 依赖变化后被推送脏标记，通过批量队列调度重新执行
 * 3. 每次执行前清理旧依赖，重新收集新依赖（支持动态依赖）
 */
class EffectImpl {
  constructor(fn) {
    this._fn = fn;

    // === 作为 Subscriber 的属性 ===
    this.deps = null;
    this.depsTail = null;
    this.flags = SubscriberFlags.Dirty; // 初始为 Dirty，会立即执行一次

    this.nextBatchEffect = null; // 批量队列单向链表指针
    this._cleanup = null;        // 用户返回的清理函数（类似 useEffect cleanup）
  }

  /** 执行 effect 函数，自动追踪依赖 */
  run() {
    // 执行用户清理函数（上次执行留下的）
    if (this._cleanup) {
      this._cleanup();
      this._cleanup = null;
    }

    // 执行前先清理所有旧依赖链接，下面重新收集
    // 这样可以支持动态依赖：每次执行都从零开始收集当前实际用到的依赖
    cleanupDeps(this, null);

    const prevSub = activeSub;

    // 设置当前 activeSub，开启依赖追踪
    activeSub = this;
    this.flags = (this.flags & ~SubscriberFlags.Dirty) | SubscriberFlags.Tracking;

    let result;
    try {
      result = this._fn();
    } finally {
      this.flags &= ~SubscriberFlags.Tracking;
      activeSub = prevSub;
    }

    // 保存用户返回的清理函数
    if (typeof result === 'function') {
      this._cleanup = result;
    }

    this.flags &= ~SubscriberFlags.Dirty;
  }

  /** 手动停止 effect，解除所有依赖 */
  stop() {
    if (this._cleanup) {
      this._cleanup();
      this._cleanup = null;
    }
    cleanupDeps(this, null);
    this.flags = SubscriberFlags.None;
  }
}

/**
 * 创建一个自动运行的 Effect
 * @param {Function} fn - effect 函数，可以返回清理函数
 * @returns {{ stop: Function }} 返回包含 stop 方法的对象
 */
export function effect(fn) {
  const e = new EffectImpl(fn);
  // 立即执行一次，收集初始依赖
  e.run();
  return {
    stop: () => e.stop(),
    _impl: e, // 暴露内部实现供调试
  };
}
