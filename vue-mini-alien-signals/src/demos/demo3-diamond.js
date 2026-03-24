/**
 * Demo 3: 菱形依赖 + PendingComputed 优化
 *
 * 这是 alien-signals 相比旧版最重要的优化场景！
 *
 * 问题（旧版行为）：
 *   source → A → C
 *   source → B → C
 *   当 source 变化时，C 会被触发两次（通过 A 和 B 各一次）
 *
 * 新版优化（PendingComputed）：
 *   source 变化时只推送 Dirty/PendingComputed 标记，
 *   C 的 effect 等到 flushBatch 时才执行，
 *   执行前通过 checkDirty 验证，最终只执行一次
 *
 *   source
 *    ├─→ compA（依赖 source）
 *    └─→ compB（依赖 source）
 *         └─→ compC（依赖 compA + compB）
 *              └─→ effect（渲染）
 */
import { signal, computed, effect } from '../reactivity/index.js';

export function runDemo3(container) {
  const section = document.createElement('section');
  section.className = 'demo-section';
  section.innerHTML = `
    <h2>Demo 3: 菱形依赖 & PendingComputed 防重复执行</h2>
    <p class="desc">
      <strong>旧版问题：</strong>菱形依赖中，底部节点会被触发多次（glitch）。<br>
      <strong>新版方案：</strong><code>PendingComputed</code> 标记 + <code>checkDirty()</code> 验证，
      保证 effect 只执行一次，且值始终一致（无 glitch）。
    </p>
    <div class="demo-graph">
      <div class="graph-row"><div class="node source-node" id="d3-src">source = 1</div></div>
      <div class="graph-row">
        <div class="node computed-node" id="d3-a">compA = ?</div>
        <div class="node computed-node" id="d3-b">compB = ?</div>
      </div>
      <div class="graph-row"><div class="node computed-node" id="d3-c">compC = ?</div></div>
      <div class="graph-row"><div class="node effect-node" id="d3-eff">effect: -</div></div>
    </div>
    <div class="demo-body">
      <div class="controls">
        <button id="d3-inc">source + 1</button>
      </div>
      <div class="output">
        <div class="output-row">
          <span class="label">effect 执行次数：</span>
          <span id="d3-effect-count" class="value highlight">0</span>
          <span class="desc">（正确应为：点击次数，无重复）</span>
        </div>
        <div class="log-box" id="d3-log"></div>
      </div>
    </div>
  `;
  container.appendChild(section);

  const logEl = section.querySelector('#d3-log');
  let effectCount = 0;

  function log(msg, type = '') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.prepend(line);
    if (logEl.children.length > 12) logEl.lastChild.remove();
  }

  const source = signal(1);

  // 菱形依赖：compA 和 compB 都依赖 source
  const compA = computed(() => {
    const v = source.value * 2;
    log(`  compA 计算 = ${source.value} × 2 = ${v}`);
    section.querySelector('#d3-a').textContent = `compA = ${v}`;
    return v;
  });

  const compB = computed(() => {
    const v = source.value + 10;
    log(`  compB 计算 = ${source.value} + 10 = ${v}`);
    section.querySelector('#d3-b').textContent = `compB = ${v}`;
    return v;
  });

  // compC 同时依赖 compA 和 compB，形成菱形
  const compC = computed(() => {
    const v = compA.value + compB.value;
    log(`  compC 计算 = compA(${compA.value}) + compB(${compB.value}) = ${v}`);
    section.querySelector('#d3-c').textContent = `compC = ${v}`;
    return v;
  });

  // 最终 effect 依赖 compC
  effect(() => {
    effectCount++;
    const val = compC.value;
    section.querySelector('#d3-eff').textContent = `effect: compC = ${val}`;
    section.querySelector('#d3-effect-count').textContent = effectCount;
    section.querySelector('#d3-src').textContent = `source = ${source.value}`;
    log(`🔄 effect 执行（第 ${effectCount} 次），compC = ${val}`, 'highlight');
  });

  section.querySelector('#d3-inc').onclick = () => {
    log(`--- 点击：source + 1 ---`, 'separator');
    source.value++;
  };
}
