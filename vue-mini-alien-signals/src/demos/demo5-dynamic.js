/**
 * Demo 5: 动态依赖收集（条件分支）
 *
 * 演示 alien-signals 的依赖清理机制：
 * 当 effect 中存在条件分支时，依赖会随条件动态变化。
 *
 * 实现原理：
 * - 每次 effect 执行前记录 depsTail 位置
 * - 执行后，depsTail 之后的旧 link 通过 cleanupDeps() 断开
 * - 这样不再访问的依赖会自动清除，避免"幽灵更新"
 */
import { signal, effect } from '../reactivity/index.js';

export function runDemo5(container) {
  const section = document.createElement('section');
  section.className = 'demo-section';
  section.innerHTML = `
    <h2>Demo 5: 动态依赖（条件分支自动清理）</h2>
    <p class="desc">
      <strong>原理：</strong>effect 每次执行时重新收集依赖，执行后
      通过 <code>cleanupDeps()</code> 清理本次未访问的旧依赖。
      <br>这确保了「只追踪当前实际使用的依赖」，避免幽灵更新。
    </p>
    <div class="demo-body">
      <div class="controls">
        <button id="d5-toggle">切换 showA (当前: true)</button>
        <button id="d5-change-a">修改 valueA</button>
        <button id="d5-change-b">修改 valueB</button>
      </div>
      <div class="output">
        <div class="output-row">
          <span class="label">showA：</span>
          <span id="d5-show" class="value">true</span>
        </div>
        <div class="output-row">
          <span class="label">当前追踪的依赖：</span>
          <span id="d5-deps" class="value highlight">-</span>
        </div>
        <div class="output-row">
          <span class="label">显示的值：</span>
          <span id="d5-result" class="value">-</span>
        </div>
        <div class="output-row">
          <span class="label">effect 执行次数：</span>
          <span id="d5-count" class="value">0</span>
        </div>
        <div class="log-box" id="d5-log"></div>
      </div>
    </div>
  `;
  container.appendChild(section);

  const logEl = section.querySelector('#d5-log');
  let runCount = 0;

  function log(msg, type = '') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.prepend(line);
    if (logEl.children.length > 12) logEl.lastChild.remove();
  }

  const showA = signal(true);
  const valueA = signal('A-初始值');
  const valueB = signal('B-初始值');

  let aChangeCount = 0;
  let bChangeCount = 0;

  effect(() => {
    runCount++;

    // 动态依赖：根据 showA 的值，只追踪 valueA 或 valueB
    // 当 showA = true：effect 依赖 [showA, valueA]
    // 当 showA = false：effect 依赖 [showA, valueB]
    // valueB/valueA 的变化在不显示时不会触发 effect（已通过 cleanupDeps 断开）
    let result, deps;
    if (showA.value) {
      result = valueA.value;
      deps = 'showA + valueA（valueB 已断开）';
    } else {
      result = valueB.value;
      deps = 'showA + valueB（valueA 已断开）';
    }

    section.querySelector('#d5-show').textContent = showA.value;
    section.querySelector('#d5-result').textContent = result;
    section.querySelector('#d5-deps').textContent = deps;
    section.querySelector('#d5-count').textContent = runCount;
    log(`🔄 effect 执行（第 ${runCount} 次）: 显示 "${result}"，依赖：${deps}`, 'highlight');
  });

  section.querySelector('#d5-toggle').onclick = () => {
    showA.value = !showA.value;
    section.querySelector('#d5-toggle').textContent = `切换 showA (当前: ${showA.value})`;
    log(`切换 showA → ${showA.value}，依赖将重新收集`);
  };

  section.querySelector('#d5-change-a').onclick = () => {
    aChangeCount++;
    valueA.value = `A-值${aChangeCount}`;
    if (!showA.value) {
      log(`⚠️ 修改 valueA，但当前不显示 A，effect 不应执行`);
    }
  };

  section.querySelector('#d5-change-b').onclick = () => {
    bChangeCount++;
    valueB.value = `B-值${bChangeCount}`;
    if (showA.value) {
      log(`⚠️ 修改 valueB，但当前不显示 B，effect 不应执行`);
    }
  };
}
