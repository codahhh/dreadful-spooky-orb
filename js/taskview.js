/* ============================================================
   Task view — window switcher
   ============================================================ */

import { icon } from './icons.js';
import { bus, esc } from './utils.js';
import { allWindows, focusedWindow } from './wm.js';
import { notify } from './notify.js';
import { el } from './utils.js';

const overlay = () => document.getElementById('task-view');
let open = false;

export function renderTaskView() {
  const root = overlay();
  const wins = allWindows().filter((w) => !w.closed);
  root.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;color:#fff;padding:0 4px 16px">
      <div style="font-size:15px;font-weight:300;opacity:.9">${wins.length ? `${wins.length} open window${wins.length > 1 ? 's' : ''}` : 'No open windows'}</div>
      <button id="tv-close" style="width:28px;height:28px;display:grid;place-items:center;border-radius:3px;color:#eee">${icon('close')}</button>
    </div>
    ${wins.length ? `<div class="tv-grid">
      ${wins.map((w) => `
        <div class="tv-card" data-id="${w.id}">
          <div class="tv-preview">
            <div class="tv-app">${icon(w.icon)}</div>
            <span style="position:absolute;bottom:6px;left:8px;font-size:10px;color:rgba(255,255,255,.45);letter-spacing:.4px">${esc(w.appId.toUpperCase())}</span>
          </div>
          <div class="tv-title"><span style="width:16px;height:16px;display:inline-flex">${icon(w.icon)}</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(w.title)}</span></div>
          <button class="tv-x" data-close="${w.id}" title="Close">${icon('close')}</button>
        </div>`).join('')}
    </div>` : `<div class="tv-empty">Windows you open will appear here.<br><span style="font-size:12px;opacity:.6">Press Win+Tab to come back any time.</span></div>`}
    <div class="tv-foot">
      <div style="display:flex;gap:10px;align-items:center">
        <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:3px;padding:7px 12px;font-size:12px">Desktop 1</div>
        <button class="tv-newdesk" id="tv-new">${icon('plus')} New desktop</button>
      </div>
      <span style="opacity:.55;font-size:11px">Timeline is napping</span>
    </div>`;

  root.querySelectorAll('.tv-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.tv-x')) return;
      const w = wins.find((x) => x.id === card.dataset.id);
      closeTaskView();
      if (w) { w.restore(); w.focus(); }
    });
  });
  root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const w = wins.find((x) => x.id === b.dataset.close);
    w?.close();
    renderTaskView();
  }));
  root.querySelector('#tv-close').addEventListener('click', closeTaskView);
  root.querySelector('#tv-new')?.addEventListener('click', () => notify({ title: 'Task View', body: 'Virtual desktops are coming soon to this build.', icon: 'taskview' }));
  root.addEventListener('pointerdown', (e) => { if (e.target === root) closeTaskView(); });
}

export function openTaskView() {
  renderTaskView();
  overlay().hidden = false;
  open = true;
  bus.emit('shell:panel', 'taskview');
}
export function closeTaskView() {
  overlay().hidden = true;
  open = false;
}
export function toggleTaskView() { open ? closeTaskView() : openTaskView(); }
export function isTaskViewOpen() { return open; }

bus.on('win:changed', () => { if (open) renderTaskView(); });
