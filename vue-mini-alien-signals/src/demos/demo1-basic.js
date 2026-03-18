/**
 * Demo 1: 基础 Signal + Effect
 * 演示最基本的响应式数据流：signal 变化 → effect 自动重新执行
 */
import { signal, effect } from '../reactivity/index.js';

export function runDemo1(container) {
  const section = document.createElement('section');
  section.className = 'demo-section';
  section.innerHTML = `
    <h2>Demo 1: Signal + Effect 基础响应式</h2>
    <p class="desc">
      <strong>原理：</strong>effect 执行时设置 <code>activeSub</code>，
      读取 signal 时调用 <code>track()</code> 建立链接；
      signal 写入时调用 <code>propagate()</code> 通知下游。
    </p>
    <div class="demo-body">
      <div class="controls">
        <button id="d1-inc">count + 1</button>
        <button id="d1-dec">count - 1</button>
        <button id="d1-stop">停止 Effect</button>
      </div>
      <div class="output">
        <div class="output-row">
          <span class="label">count.value：</span>
          <span id="d1-count" class="value">-</span>
        </div>
        <div class="output-row">
          <span class="label">effect 执行次数：</span>
          <span id="d1-runs" class="value">0</span>
        </div>
        <div class="log-box" id="d1-log"></div>
      </div>
    </div>
  `;
  container.appendChild(section);

  const countEl = section.querySelector('#d1-count');
  const runsEl = section.querySelector('#d1-runs');
  const logEl = section.querySelector('#d1-log');

  function log(msg) {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.prepend(line);
    if (logEl.children.length > 8) logEl.lastChild.remove();
  }

  // 创建响应式信号
  const count = signal(0);
  let runCount = 0;

  // 创建 effect：自动追踪 count，每次变化都重新执行
  const runner = effect(() => {
    runCount++;
    const val = count.value; // 触发 track()，建立依赖
    countEl.textContent = val;
    runsEl.textContent = runCount;
    log(`effect 执行，count = ${val}`);
  });

  section.querySelector('#d1-inc').onclick = () => { count.value++; };
  section.querySelector('#d1-dec').onclick = () => { count.value--; };
  section.querySelector('#d1-stop').onclick = () => {
    runner.stop();
    log('effect 已停止，不再响应变化');
  };
}
