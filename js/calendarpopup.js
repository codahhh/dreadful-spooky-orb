/* ============================================================
   Calendar flyout (date/time on the taskbar)
   ============================================================ */

import { icon } from './icons.js';
import { el, esc, bus, MONTHS, DOW, pad2 } from './utils.js';
import { openApp } from './launcher.js';

const panel = () => document.getElementById('calendar-flyout');
let open = false;
let view = new Date();
view.setDate(1);

function render() {
  const now = new Date();
  const root = panel();
  const y = view.getFullYear(), m = view.getMonth();
  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();

  let cells = '';
  for (let i = 0; i < startDow; i++) {
    cells += `<div class="day other">${prevDays - startDow + i + 1}</div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === now.getDate() && m === now.getMonth() && y === now.getFullYear();
    cells += `<div class="day${isToday ? ' today' : ''}">${d}</div>`;
  }
  const total = startDow + daysInMonth;
  for (let i = 0; i < (7 - (total % 7)) % 7; i++) cells += `<div class="day other">${i + 1}</div>`;

  const events = [
    { t: '09:00', title: 'Windows Update — automatic restart', sub: 'System' },
    { t: '11:30', title: 'Meeting: Taskbar alignment debate', sub: 'Microsoft Teams' },
    { t: '16:00', title: 'Minesweeper championship', sub: 'Desktop' },
  ];

  root.innerHTML = `
    <div class="cal-head">
      <div class="cal-clock">${pad2(now.getHours())}:${pad2(now.getMinutes())}</div>
      <div class="cal-date">${now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>
    <div class="cal-month">
      <span>${MONTHS[m]} ${y}</span>
      <span style="display:flex;gap:2px">
        <button data-nav="-1" title="Previous month">${icon('back')}</button>
        <button data-nav="1" title="Next month">${icon('forward')}</button>
      </span>
    </div>
    <div class="cal-grid">
      ${DOW.map((d) => `<div class="dow">${d}</div>`).join('')}
      ${cells}
    </div>
    <div class="cal-agenda">
      <div style="font-size:11px;color:#9a9a9a;margin-bottom:6px">Today</div>
      ${events.map((e) => `<div class="ag"><span class="t">${e.t}</span><span><b>${esc(e.title)}</b><div style="font-size:10.5px;color:#9a9a9a">${esc(e.sub)}</div></span></div>`).join('')}
    </div>
    <div class="cal-foot">
      <a id="cal-open">Open Calendar</a>
      <span style="opacity:.6">Week starts on Sunday</span>
    </div>`;

  root.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => {
    view = new Date(y, m + (+b.dataset.nav), 1);
    render();
  }));
  root.querySelector('#cal-open').addEventListener('click', () => { closeCal(); openApp('calendar'); });
}

export function openCal() {
  view = new Date(); view.setDate(1);
  render();
  panel().hidden = false;
  open = true;
  bus.emit('shell:panel', 'calendar');
  setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
}
export function closeCal() {
  panel().hidden = true;
  open = false;
  document.removeEventListener('pointerdown', outside, true);
}
export function toggleCal() { open ? closeCal() : openCal(); }
export function isCalOpen() { return open; }

function outside(e) {
  if (panel().contains(e.target) || e.target.closest('#clock')) return;
  if (e.target.closest('.menu')) return;
  closeCal();
}
