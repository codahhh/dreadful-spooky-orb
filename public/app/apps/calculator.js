/* ============================================================
   Calculator
   ============================================================ */

import { createWindow } from '../wm.js';
import { showDialog } from '../utils.js';
import { icon } from '../icons.js';

export const meta = { id: 'calculator', name: 'Calculator', icon: 'calculator' };

const fmt = (n) => {
  if (!isFinite(n)) return 'Cannot divide by zero';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-9)) return n.toExponential(8).replace('e+', 'e+');
  const rounded = Math.round(n * 1e12) / 1e12;
  return String(rounded);
};

export function launch() {
  const win = createWindow({
    title: 'Calculator', icon: 'calculator', width: 356, height: 556,
    minWidth: 300, minHeight: 440, appId: 'calculator',
  });

  let cur = '0';
  let acc = null;
  let op = null;
  let fresh = true;
  let mem = 0;
  let history = [];

  win.body.innerHTML = `
    <div class="calc">
      <div class="calc-title">Standard</div>
      <div class="calc-display">
        <div class="calc-expr"></div>
        <div class="calc-value">0</div>
      </div>
      <div class="calc-memrow">
        <button data-mem="MC">MC</button><button data-mem="MR">MR</button>
        <button data-mem="M+">M+</button><button data-mem="M-">M-</button><button data-mem="MS">MS</button>
      </div>
      <div class="calc-keys">
        <button class="fn" data-k="%">%</button>
        <button class="fn" data-k="CE">CE</button>
        <button class="fn" data-k="C">C</button>
        <button class="fn" data-k="back">⌫</button>

        <button class="fn accent" data-k="1/x"><sup>1</sup>/x</button>
        <button class="fn accent" data-k="sqr">x<sup>2</sup></button>
        <button class="fn accent" data-k="sqrt">√x</button>
        <button class="op" data-k="÷">÷</button>

        <button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button>
        <button class="op" data-k="×">×</button>

        <button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button>
        <button class="op" data-k="−">−</button>

        <button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button>
        <button class="op" data-k="+">+</button>

        <button class="fn" data-k="±">±</button><button data-k="0">0</button><button data-k=".">.</button>
        <button class="eq" data-k="=">=</button>
      </div>
    </div>`;

  const valEl = win.body.querySelector('.calc-value');
  const exprEl = win.body.querySelector('.calc-expr');

  function showVal() {
    valEl.textContent = typeof cur === 'number' ? fmt(cur) : cur;
    valEl.style.fontSize = (valEl.textContent.length > 14 ? 26 : valEl.textContent.length > 10 ? 31 : 38) + 'px';
  }

  function calc(a, b, o) {
    switch (o) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b;
      default: return b;
    }
  }

  function input(v) {
    const key = String(v);
    if (/^[0-9]$/.test(key)) {
      if (fresh) { cur = key; fresh = false; }
      else cur = cur === '0' ? key : (cur.length < 18 ? cur + key : cur);
    } else if (key === '.') {
      if (fresh) { cur = '0.'; fresh = false; }
      else if (!cur.includes('.')) cur += '.';
    }
    showVal();
  }

  function press(k) {
    if (/^[0-9.]$/.test(k)) { input(k); return; }
    switch (k) {
      case 'C':
        cur = '0'; acc = null; op = null; fresh = true; exprEl.textContent = ''; break;
      case 'CE':
        cur = '0'; fresh = true; break;
      case 'back':
        if (fresh) break;
        cur = cur.length > 1 ? cur.slice(0, -1) : '0';
        if (cur === '-') cur = '0';
        break;
      case '±':
        cur = cur.startsWith('-') ? cur.slice(1) : (cur === '0' ? '0' : '-' + cur);
        break;
      case '+': case '−': case '×': case '÷': {
        const v = parseFloat(cur);
        if (op && !fresh) { acc = calc(acc, v, op); cur = fmt(acc); }
        else acc = v;
        op = k; fresh = true;
        exprEl.textContent = `${fmt(acc)} ${k}`;
        showVal();
        return;
      }
      case '=': {
        if (op == null) { exprEl.textContent = ''; break; }
        const v = parseFloat(cur);
        const res = calc(acc, v, op);
        history.unshift(`${fmt(acc)} ${op} ${fmt(v)} = ${fmt(res)}`);
        exprEl.textContent = `${fmt(acc)} ${op} ${fmt(v)} =`;
        cur = isFinite(res) ? fmt(res) : 'Cannot divide by zero';
        acc = null; op = null; fresh = true;
        showVal();
        return;
      }
      case '1/x': {
        const v = parseFloat(cur);
        cur = v === 0 ? 'Cannot divide by zero' : fmt(1 / v);
        fresh = true;
        break;
      }
      case 'sqr': {
        const v = parseFloat(cur);
        cur = fmt(v * v); fresh = true; break;
      }
      case 'sqrt': {
        const v = parseFloat(cur);
        cur = v < 0 ? 'Invalid input' : fmt(Math.sqrt(v));
        fresh = true; break;
      }
      case '%': {
        const v = parseFloat(cur);
        cur = fmt(acc != null ? (acc * v) / 100 : v / 100);
        fresh = true; break;
      }
      default: return;
    }
    showVal();
  }

  win.body.querySelectorAll('[data-k]').forEach((b) => {
    b.addEventListener('click', () => press(b.dataset.k));
  });
  win.body.querySelectorAll('[data-mem]').forEach((b) => {
    b.addEventListener('click', () => {
      const v = parseFloat(cur) || 0;
      switch (b.dataset.mem) {
        case 'MC': mem = 0; break;
        case 'MR': cur = fmt(mem); fresh = true; break;
        case 'M+': mem += v; break;
        case 'M-': mem -= v; break;
        case 'MS': mem = v; break;
      }
      showVal();
      win.body.querySelector('.calc-memrow').style.color = mem ? 'var(--accent)' : '';
    });
  });

  win.body.addEventListener('keydown', (e) => {
    const map = { '/': '÷', '*': '×', '-': '−', '+': '+', 'Enter': '=', '=': '=', 'Backspace': 'back', 'Escape': 'C' };
    if (e.key === 'Delete') { press('CE'); e.preventDefault(); return; }
    if (map[e.key]) { e.preventDefault(); press(map[e.key]); return; }
    if (/^[0-9.]$/.test(e.key)) { e.preventDefault(); press(e.key); }
  });
  win.body.tabIndex = 0;
  setTimeout(() => win.body.focus(), 50);

  showVal();
  return win;
}
