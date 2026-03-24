/**
 * Demo 2: Computed 懒计算
 * 演示 Push-Pull 混合模型：
 * - Push：signal 变化时，向 computed 推送 Dirty 标记
 * - Pull：读取 computed.value 时，才真正重新计算
 *
 * 关键特性：computed 只有在被读取时才重新计算（懒）
 */
import { signal, computed, effect } from '../reactivity/index.js';

export function runDemo2(container) {
  const section = document.createElement('section');
  section.className = 'demo-section';
  section.innerHTML = `
    <h2>Demo 2: Computed 懒计算（Push-Pull 混合）</h2>
    <p class="desc">
      <strong>原理：</strong>signal 变化时只 <em>推送</em> Dirty 标记给 computed（Push）；
      只有当 effect 真正读取 computed.value 时，才触发重新计算（Pull）。
      <br>链式：<code>price × quantity → subtotal → total（含税）</code>
    </p>
    <div class="demo-body">
      <div class="controls">
        <label>price：<input id="d2-price" type="number" value="100" style="width:80px"></label>
        <label>quantity：<input id="d2-qty" type="number" value="2" style="width:60px"></label>
        <label>taxRate：<input id="d2-tax" type="number" value="0.1" step="0.05" style="width:70px"></label>
      </div>
      <div class="output">
        <div class="output-row">
          <span class="label">subtotal（price×qty）：</span>
          <span id="d2-sub" class="value">-</span>
          <span class="compute-count" id="d2-sub-count">计算 0 次</span>
        </div>
        <div class="output-row">
          <span class="label">total（subtotal×(1+tax)）：</span>
          <span id="d2-total" class="value">-</span>
          <span class="compute-count" id="d2-total-count">计算 0 次</span>
        </div>
        <div class="log-box" id="d2-log"></div>
      </div>
    </div>
  `;
  container.appendChild(section);

  const subEl = section.querySelector('#d2-sub');
  const totalEl = section.querySelector('#d2-total');
  const subCountEl = section.querySelector('#d2-sub-count');
  const totalCountEl = section.querySelector('#d2-total-count');
  const logEl = section.querySelector('#d2-log');

  let subCalcCount = 0;
  let totalCalcCount = 0;

  function log(msg) {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.prepend(line);
    if (logEl.children.length > 10) logEl.lastChild.remove();
  }

  // 原始信号
  const price = signal(100);
  const quantity = signal(2);
  const taxRate = signal(0.1);

  // 第一层 computed：小计
  const subtotal = computed(() => {
    subCalcCount++;
    const result = price.value * quantity.value;
    log(`  📐 subtotal 重新计算 = ${price.value} × ${quantity.value} = ${result}`);
    subCountEl.textContent = `计算 ${subCalcCount} 次`;
    return result;
  });

  // 第二层 computed：含税总价（依赖 subtotal 和 taxRate）
  const total = computed(() => {
    totalCalcCount++;
    // 这里读取 subtotal.value 会触发 Pull：
    // 如果 subtotal 是 Dirty 则先计算 subtotal，再计算 total
    const result = subtotal.value * (1 + taxRate.value);
    log(`  📐 total 重新计算 = ${subtotal.value.toFixed(2)} × (1 + ${taxRate.value}) = ${result.toFixed(2)}`);
    totalCountEl.textContent = `计算 ${totalCalcCount} 次`;
    return result;
  });

  // effect 读取最终值，驱动 Pull
  effect(() => {
    const t = total.value;
    const s = subtotal.value;
    subEl.textContent = s.toFixed(2);
    totalEl.textContent = t.toFixed(2);
    log(`🔄 effect 执行：subtotal=${s.toFixed(2)}, total=${t.toFixed(2)}`);
  });

  // 绑定输入事件
  section.querySelector('#d2-price').oninput = (e) => {
    log(`✏️ price → ${e.target.value}`);
    price.value = Number(e.target.value);
  };
  section.querySelector('#d2-qty').oninput = (e) => {
    log(`✏️ quantity → ${e.target.value}`);
    quantity.value = Number(e.target.value);
  };
  section.querySelector('#d2-tax').oninput = (e) => {
    log(`✏️ taxRate → ${e.target.value}`);
    taxRate.value = Number(e.target.value);
  };
}
