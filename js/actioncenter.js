/* ============================================================
   Action center
   ============================================================ */

import { state, save, updateSettings } from './store.js';
import { icon } from './icons.js';
import { el, esc, bus, fmtTime } from './utils.js';
import { clearAllNotifications } from './notify.js';
import { openApp } from './launcher.js';

const panel = () => document.getElementById('action-center');
let open = false;

const QUICK = [
  { id: 'wifi', label: 'Wi-Fi', icon: 'wifi', get: () => state.settings.wifi, set: (v) => updateSettings({ wifi: v }) },
  { id: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth', get: () => state.settings.bluetooth, set: (v) => updateSettings({ bluetooth: v }) },
  { id: 'airplane', label: 'Airplane mode', icon: 'airplane', get: () => state.settings.airplane, set: (v) => updateSettings({ airplane: v }) },
  { id: 'night', label: 'Night light', icon: 'nightlight', get: () => state.settings.nightLight, set: (v) => updateSettings({ nightLight: v }) },
  { id: 'focus', label: 'Focus assist', icon: 'focus', get: () => state.settings.focusAssist, set: (v) => updateSettings({ focusAssist: v }) },
  { id: 'settings', label: 'All settings', icon: 'allsettings', action: () => { closeAC(); openApp('settings'); } },
  { id: 'connect', label: 'Connect', icon: 'connect', action: () => openApp('settings', { page: 'display' }) },
  { id: 'project', label: 'Project', icon: 'project', action: () => openApp('settings', { page: 'display' }) },
  { id: 'nearby', label: 'Nearby sharing', icon: 'share', get: () => false, set: () => {} },
  { id: 'screenshot', label: 'Snip & Sketch', icon: 'edit', action: () => openApp('paint') },
];

function render() {
  const root = panel();
  const notifs = state.notifications || [];
  root.innerHTML = `
    <div class="ac-inner">
      <div class="ac-head">
        <span>Notifications</span>
        <button id="ac-clear">Clear all</button>
      </div>
      <div class="ac-notifs">
        ${notifs.length ? notifs.map((n, i) => `
          <div class="ac-card" data-i="${i}">
            <div class="ac-ico">${icon(n.icon || 'windows')}</div>
            <div style="flex:1;min-width:0">
              <b>${esc(n.title)}</b>
              <p>${esc(n.body)}</p>
              <div class="ac-time">${fmtTime(n.time)}</div>
            </div>
            <button class="ac-x" data-x="${i}">${icon('close')}</button>
          </div>`).join('') : `<div class="ac-empty">No new notifications</div>`}
      </div>
      <div class="ac-quick">
        ${QUICK.map((q) => {
          const on = q.get ? q.get() : false;
          return `<button class="qa${on ? ' on' : ''}" data-q="${q.id}">${icon(q.icon)}<span class="qa-t">${q.label}</span></button>`;
        }).join('')}
      </div>
      <div class="ac-slider">
        <div class="row"><span>Display brightness</span><span id="br-val">${state.settings.brightness}%</span></div>
        <input id="br-range" type="range" min="20" max="100" value="${state.settings.brightness}">
      </div>
      <div class="ac-foot">
        <button id="ac-expand" title="Expand">${icon('grid')}</button>
        <div style="display:flex;gap:2px">
          <button id="ac-night" title="Night light">${icon('nightlight')}</button>
          <button id="ac-focus" title="Focus assist">${icon('focus')}</button>
        </div>
      </div>
    </div>`;

  root.querySelectorAll('[data-q]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const q = QUICK.find((x) => x.id === btn.dataset.q);
      if (!q) return;
      if (q.action) { q.action(); return; }
      q.set(!q.get());
      render();
    });
  });
  root.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    state.notifications.splice(+b.dataset.x, 1);
    save();
    render();
    bus.emit('notif:changed');
  }));
  root.querySelector('#ac-clear').addEventListener('click', () => { clearAllNotifications(); render(); });
  root.querySelector('#br-range').addEventListener('input', (e) => {
    updateSettings({ brightness: +e.target.value });
    root.querySelector('#br-val').textContent = e.target.value + '%';
  });
  root.querySelectorAll('.ac-card').forEach((c) => c.addEventListener('click', () => {
    const n = state.notifications[+c.dataset.i];
    if (n?.appId) openApp(n.appId);
  }));
  root.querySelector('#ac-expand').addEventListener('click', () => openApp('settings', { page: 'update' }));
  root.querySelector('#ac-night').addEventListener('click', () => { updateSettings({ nightLight: !state.settings.nightLight }); render(); });
  root.querySelector('#ac-focus').addEventListener('click', () => { updateSettings({ focusAssist: !state.settings.focusAssist }); render(); });
}

export function openAC() {
  render();
  panel().hidden = false;
  open = true;
  bus.emit('shell:panel', 'ac');
  setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
}
export function closeAC() {
  panel().hidden = true;
  open = false;
  document.removeEventListener('pointerdown', outside, true);
}
export function toggleAC() { open ? closeAC() : openAC(); }
export function isACOpen() { return open; }

function outside(e) {
  if (panel().contains(e.target) || e.target.closest('#notif-btn') || e.target.closest('#tray')) return;
  if (e.target.closest('.menu')) return;
  closeAC();
}

bus.on('notif:changed', () => { if (open) render(); });
