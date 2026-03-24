/**
 * Demo 6: 新旧版本对比（链表 vs Set）
 *
 * 通过对比 Vue 3.5（Set-based）和 Vue 3.6（linked-list-based）
 * 的内存模型，直观理解 alien-signals 的优势。
 *
 * 旧版（Vue ≤ 3.5）：
 *   - dep.subs = Set<ReactiveEffect>
 *   - effect.deps = ReactiveEffect[]（数组）
 *   - 清理依赖需要遍历数组并从 Set 中删除 → O(n)
 *
 * 新版（Vue 3.6 alien-signals）：
 *   - dep.subs = 双向链表（Link.prevSub/nextSub）
 *   - effect.deps = 双向链表（Link.prevDep/nextDep）
 *   - 清理依赖只需摘链表节点 → O(1)
 *   - Link 节点可复用，减少 GC
 */
import { signal, computed, effect } from '../reactivity/index.js';

export function runDemo6(container) {
  const section = document.createElement('section');
  section.className = 'demo-section';
  section.innerHTML = `
    <h2>Demo 6: 新旧响应式系统对比</h2>
    <div class="comparison">
      <div class="compare-col">
        <h3>Vue ≤ 3.5（Set-based）</h3>
        <pre class="code-block">
class Dep {
  // Set 存储所有订阅者
  subs = new Set()

  track() {
    if (activeEffect) {
      // 双向引用
      this.subs.add(activeEffect)
      activeEffect.deps.push(this)
    }
  }

  trigger() {
    // 遍历 Set，触发所有 effect
    for (const effect of this.subs) {
      effect.run()
    }
  }
}

// 清理依赖：O(n) 遍历
function cleanup(effect) {
  for (const dep of effect.deps) {
    dep.subs.delete(effect) // O(1) 但需遍历
  }
  effect.deps.length = 0
}</pre>
        <div class="compare-analysis">
          <h4>问题</h4>
          <ul>
            <li>Set 内存占用固定，即使只有 1 个订阅者也要 Set 结构</li>
            <li>依赖清理需要遍历 deps 数组并从各 Set 删除</li>
            <li>菱形依赖下 effect 可能执行多次（glitch）</li>
            <li>无法跳过"值未真正改变"的 computed 链</li>
          </ul>
        </div>
      </div>
      <div class="compare-col">
        <h3>Vue 3.6（Linked-list-based）</h3>
        <pre class="code-block">
// Link 节点：dep-sub 之间的边
type Link = {
  dep, sub,
  // dep.subs 链表（纵向）
  prevSub, nextSub,
  // sub.deps 链表（横向）
  prevDep, nextDep,
}

// dep 只存链表头尾
class Signal {
  subs: Link | null     // 头
  subsTail: Link | null // 尾
}

// 清理依赖：O(1) 摘链表
function cleanupDeps(sub, newTail) {
  let link = sub.depsTail
  while (link && link !== newTail) {
    removeLinkFromDep(link) // 摘链 O(1)
    link = link.prevDep
  }
}</pre>
        <div class="compare-analysis">
          <h4>优势</h4>
          <ul>
            <li>无 Set 开销，链表节点可复用（减少 GC）</li>
            <li>依赖清理 O(1) 摘链，更高效</li>
            <li>PendingComputed 防止菱形 glitch</li>
            <li>版本号（version）跳过无效计算</li>
          </ul>
        </div>
      </div>
    </div>

    <h3 style="margin-top:20px">可视化：链表内存结构</h3>
    <div class="demo-body">
      <div class="controls">
        <button id="d6-add">添加更多 Effect</button>
        <button id="d6-trigger">触发更新</button>
        <button id="d6-visualize">可视化链表</button>
      </div>
      <div id="d6-viz" class="viz-container"></div>
      <div class="log-box" id="d6-log"></div>
    </div>
  `;
  container.appendChild(section);

  const logEl = section.querySelector('#d6-log');
  const vizEl = section.querySelector('#d6-viz');

  function log(msg) {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.prepend(line);
    if (logEl.children.length > 8) logEl.lastChild.remove();
  }

  // 创建一个可观察的信号
  const src = signal(1);
  const effects = [];

  // 初始创建 2 个 effect
  for (let i = 0; i < 2; i++) {
    const e = effect(() => {
      const v = src.value;
      log(`effect-${i + 1} 执行，src = ${v}`);
    });
    effects.push(e);
  }

  section.querySelector('#d6-add').onclick = () => {
    const idx = effects.length;
    const e = effect(() => {
      const v = src.value;
      log(`effect-${idx + 1} 执行，src = ${v}`);
    });
    effects.push(e);
    log(`新增 effect-${idx + 1}`);
  };

  section.querySelector('#d6-trigger').onclick = () => {
    log(`--- 触发更新 src = ${src.value + 1} ---`);
    src.value++;
  };

  section.querySelector('#d6-visualize').onclick = () => {
    // 可视化 src 的订阅者链表
    vizEl.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'viz-title';
    title.textContent = `src.subs 链表（共 ${effects.length} 个订阅者）：`;
    vizEl.appendChild(title);

    const chain = document.createElement('div');
    chain.className = 'viz-chain';

    let link = src._value !== undefined ? null : null;
    // 访问内部结构（仅用于演示）
    // 实际访问 signal 实例的 subs 链表
    const srcSignal = src; // signal 返回的是 SignalImpl 实例

    // 由于 signal() 返回 SignalImpl 实例，可以直接访问
    // 但在 demo 中我们通过读取效果来显示
    const nodeEl = document.createElement('div');
    nodeEl.className = 'viz-node source';
    nodeEl.textContent = `Signal(src=${src.value})`;
    chain.appendChild(nodeEl);

    effects.forEach((e, i) => {
      const arrow = document.createElement('span');
      arrow.className = 'viz-arrow';
      arrow.textContent = ' → ';
      chain.appendChild(arrow);

      const effEl = document.createElement('div');
      effEl.className = 'viz-node effect';
      effEl.textContent = `Effect-${i + 1}`;
      chain.appendChild(effEl);
    });

    vizEl.appendChild(chain);
    log(`可视化：src 有 ${effects.length} 个订阅者（链表节点）`);
  };
}
