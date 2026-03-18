/**
 * Demo 4: 批量更新（startBatch / endBatch）
 *
 * 场景：同时修改多个 signal，希望 effect 只执行一次，而不是每修改一次就执行一次。
 *
 * 实现原理：
 * - startBatch() 使 batchDepth++，期间 effect 只加入队列，不执行
 * - endBatch() 使 batchDepth--，归零时 flushBatch() 统一执行
 *
 * 对应 Vue 中的 nextTick 机制的底层支持
 */
import { signal, computed, effect, startBatch, endBatch } from '../reactivity/index.js';

export function runDemo4(container) {
  const section = document.createElement('section');
  section.className = 'demo-section';
  section.innerHTML = `
    <h2>Demo 4: 批量更新 startBatch / endBatch</h2>
    <p class="desc">
      <strong>原理：</strong>批量模式下，多次 signal 写入只会将 effect 加入队列，
      不立即执行。<code>endBatch()</code> 时统一 flush，effect 只执行一次。
    </p>
    <div class="demo-body">
      <div class="controls">
        <button id="d4-single">逐个修改（无批量）</button>
        <button id="d4-batch">批量修改（startBatch）</button>
        <button id="d4-reset">重置</button>
      </div>
      <div class="output">
        <div class="output-row">
          <span class="label">firstName：</span>
          <span id="d4-first" class="value">-</span>
        </div>
        <div class="output-row">
          <span class="label">lastName：</span>
          <span id="d4-last" class="value">-</span>
        </div>
        <div class="output-row">
          <span class="label">fullName：</span>
          <span id="d4-full" class="value highlight">-</span>
        </div>
        <div class="output-row">
          <span class="label">effect 执行次数：</span>
          <span id="d4-count" class="value">0</span>
        </div>
        <div class="log-box" id="d4-log"></div>
      </div>
    </div>
  `;
  container.appendChild(section);

  const logEl = section.querySelector('#d4-log');
  let runCount = 0;

  function log(msg, type = '') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.prepend(line);
    if (logEl.children.length > 10) logEl.lastChild.remove();
  }

  const firstName = signal('张');
  const lastName = signal('三');

  const fullName = computed(() => firstName.value + lastName.value);

  effect(() => {
    runCount++;
    const fn = firstName.value;
    const ln = lastName.value;
    const full = fullName.value;
    section.querySelector('#d4-first').textContent = fn;
    section.querySelector('#d4-last').textContent = ln;
    section.querySelector('#d4-full').textContent = full;
    section.querySelector('#d4-count').textContent = runCount;
    log(`🔄 effect 执行（第 ${runCount} 次）: ${full}`, 'highlight');
  });

  let nameIndex = 1;
  const names = [
    ['李', '四'], ['王', '五'], ['赵', '六'], ['钱', '七']
  ];

  section.querySelector('#d4-single').onclick = () => {
    const [f, l] = names[nameIndex % names.length];
    nameIndex++;
    log(`--- 逐个修改（预期执行 2 次）---`, 'separator');
    // 没有批量保护，修改 firstName 会立即触发 effect（第1次）
    // 修改 lastName 会再次触发 effect（第2次）
    firstName.value = f;
    lastName.value = l;
  };

  section.querySelector('#d4-batch').onclick = () => {
    const [f, l] = names[nameIndex % names.length];
    nameIndex++;
    log(`--- 批量修改（预期执行 1 次）---`, 'separator');
    startBatch();
    firstName.value = f; // 加入队列，不执行
    lastName.value = l;  // 加入队列，不执行
    endBatch();          // flush，只执行一次
  };

  section.querySelector('#d4-reset').onclick = () => {
    startBatch();
    firstName.value = '张';
    lastName.value = '三';
    runCount = 0;
    endBatch();
    log('--- 重置 ---', 'separator');
  };
}
