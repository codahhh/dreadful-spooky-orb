/* ============================================================
   Taskbar: pinned + running apps, tray, clock, show desktop
   ============================================================ */

import { state, save, updateSettings } from './store.js';
import { icon } from './icons.js';
import { el, esc, bus, pad2, isTouchUI } from './utils.js';
import { allWindows, focusedWindow, minimizeAll, restoreAll, visibleWindows } from './wm.js';
import { openApp } from './launcher.js';
import { appMeta } from './apps/registry.js';
import { openMenu } from './contextmenu.js';
import { notify } from './notify.js';

const tasksEl = () => document.getElementById('tasks');
let previewEl = null;
let previewTimer = null;
let lastShowDesktop = 0;

export function refreshTasks() {
  const host = tasksEl();
  if (!host) return;
  host.innerHTML = '';
  const pinned = state.settings.taskbarPinned || [];
  const running = allWindows().filter((w) => !w.closed);
  const runningIds = [...new Set(running.map((w) => w.appId))];
  const ids = [...pinned, ...runningIds.filter((id) => !pinned.includes(id))];

  ids.forEach((id) => {
    const meta = appMeta(id) || { name: id, icon: 'file' };
    const wins = running.filter((w) => w.appId === id);
    const isRunning = wins.length > 0;
    const isFocused = wins.some((w) => w === focusedWindow());
    const btn = el('button', {
      class: 'task' + (isRunning ? ' running' : ' pinned') + (isFocused ? ' active' : ''),
      title: meta.name,
      dataset: { app: id },
    });
    btn.innerHTML = `<span class="task-icon">${icon(meta.icon)}</span>`;
    btn.addEventListener('click', () => {
      const ws = allWindows().filter((w) => w.appId === id && !w.closed);
      if (!ws.length) { openApp(id); return; }
      const top = ws[ws.length - 1];
      if (top.minimized) { top.restore(); top.focus(); }
      else if (top === focusedWindow()) top.minimize();
      else top.focus();
    });
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const ws = allWindows().filter((w) => w.appId === id && !w.closed);
      const items = [
        { label: meta.name, icon: meta.icon, action: () => openApp(id) },
        'sep',
      ];
      ws.forEach((w) => items.push({ label: w.title, icon: w.icon, action: () => { w.restore(); w.focus(); } }));
      if (ws.length) items.push('sep', { label: ws.length > 1 ? `Close all windows` : 'Close window', icon: 'close', action: () => ws.forEach((w) => w.close()) });
      items.push('sep', {
        label: state.settings.taskbarPinned.includes(id) ? 'Unpin from taskbar' : 'Pin to taskbar',
        icon: 'pin',
        action: () => {
          const p = new Set(state.settings.taskbarPinned);
          if (p.has(id)) p.delete(id); else p.add(id);
          updateSettings({ taskbarPinned: [...p] });
          refreshTasks();
        },
      });
      openMenu(e.clientX, e.clientY, items, { dark: true });
    });

    btn.addEventListener('pointerenter', () => {
      clearTimeout(previewTimer);
      if (isTouchUI()) return; // hover previews make no sense on a touch screen
      previewTimer = setTimeout(() => showPreview(btn, id, meta, wins), 380);
    });
    btn.addEventListener('pointerleave', () => {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(hidePreview, 240);
    });

    host.append(btn);
  });
}

function showPreview(anchor, id, meta, wins) {
  hidePreview();
  const r = anchor.getBoundingClientRect();
  const p = el('div', { class: 'taskbar-preview' });
  const w = wins[wins.length - 1];
  p.innerHTML = `<div class="tp-head"><span style="width:16px;height:16px;display:inline-flex">${icon(meta.icon)}</span><span>${esc(w ? w.title : meta.name)}</span></div>
    <div class="tp-body">${w ? (w.minimized ? 'Minimized' : 'Window preview') : 'Not running'}</div>`;
  p.addEventListener('pointerenter', () => clearTimeout(previewTimer));
  p.addEventListener('pointerleave', () => hidePreview());
  p.addEventListener('click', () => {
    const list = wins.length ? wins : allWindows().filter((w) => w.appId === id);
    const w = list[list.length - 1];
    if (w) { w.restore(); w.focus(); }
    else openApp(id);
    hidePreview();
  });
  document.getElementById('taskbar').append(p);
  const pw = 210;
  p.style.left = Math.max(6, Math.min(r.left + r.width / 2 - pw / 2, window.innerWidth - pw - 6)) + 'px';
  previewEl = p;
}

export function hidePreview() {
  if (previewEl) { previewEl.remove(); previewEl = null; }
}

/* ------------------------------ clock ------------------------------ */
function tickClock() {
  const t = document.getElementById('clock-time');
  const d = document.getElementById('clock-date');
  if (!t) return;
  const now = new Date();
  t.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  d.textContent = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
  document.getElementById('clock').title = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function updateNotifBadge() {
  const btn = document.getElementById('notif-btn');
  if (!btn) return;
  btn.querySelector('.dot')?.remove();
  if (state.notifications?.length) {
    const dot = el('span', { class: 'dot' });
    btn.append(dot);
  }
}

/* ------------------------------ tray flyouts ------------------------------ */
let activeFlyout = null;
function closeTrayFlyout() {
  const f = document.getElementById('tray-flyout');
  f.hidden = true;
  f.innerHTML = '';
  activeFlyout = null;
  document.removeEventListener('pointerdown', outsideTray, true);
}
function outsideTray(e) {
  const f = document.getElementById('tray-flyout');
  const t = e.target instanceof Element ? e.target : null;
  if (!t || f.contains(t) || t.closest('#tray')) return;
  closeTrayFlyout();
}

function showTrayFlyout(anchor, content, width = 300) {
  const f = document.getElementById('tray-flyout');
  if (activeFlyout === anchor && !f.hidden) { closeTrayFlyout(); return; }
  f.hidden = false;
  f.innerHTML = '';
  f.style.width = width + 'px';
  f.style.left = 'auto';
  f.style.right = Math.max(6, window.innerWidth - anchor.getBoundingClientRect().right) + 'px';
  f.style.bottom = 'calc(var(--taskbar-h) + 6px)';
  f.style.background = 'rgba(32,32,32,.97)';
  f.style.color = '#eee';
  f.style.borderRadius = '4px';
  f.append(content);
  activeFlyout = anchor;
  setTimeout(() => document.addEventListener('pointerdown', outsideTray, true), 0);
}

const rowStyle = 'display:flex;align-items:center;gap:10px;padding:9px 12px;font-size:12px;border-radius:3px';

function networkFlyout(anchor) {
  const list = [
    { name: 'SpookyOrb-5G', bars: 4, secured: true, connected: true },
    { name: 'SpookyOrb-2.4G', bars: 3, secured: true },
    { name: 'FREE_AIRPORT_WIFI', bars: 2, secured: false },
    { name: 'NETGEAR-42', bars: 1, secured: true },
    { name: 'HP-Print-4A', bars: 1, secured: false },
  ];
  const wrap = el('div', {});
  wrap.innerHTML = `<div style="padding:12px 14px 8px;font-size:13px;display:flex;align-items:center;justify-content:space-between">
      <span>Wi-Fi</span>
      <span style="display:flex;gap:8px">
        <button class="tray-mini" data-act="toggle" style="width:34px;height:18px;border-radius:9px;background:${state.settings.wifi ? 'var(--accent)' : '#777'};position:relative">
          <span style="position:absolute;top:3px;left:${state.settings.wifi ? '19px' : '3px'};width:12px;height:12px;border-radius:50%;background:#fff;transition:left .15s"></span>
        </button>
      </span>
    </div>
    <div class="tray-list" style="max-height:250px;overflow:auto;padding:0 6px 8px"></div>
    <div style="border-top:1px solid rgba(255,255,255,.12);padding:4px">
      <button style="width:100%;text-align:left;padding:9px 12px;font-size:12px;border-radius:3px">Network &amp; Internet settings</button>
    </div>`;
  const listEl = wrap.querySelector('.tray-list');
  list.forEach((n) => {
    const row = el('div', { style: rowStyle + ';cursor:default' });
    row.innerHTML = `<span style="width:18px;height:18px;display:inline-flex;opacity:${state.settings.wifi ? 0.9 : 0.35}">${icon('wifi')}</span>
      <span style="flex:1;display:flex;flex-direction:column;gap:1px">
        <span>${n.name}</span>
        ${n.connected ? '<span style="font-size:10.5px;color:#8fd0ff">Connected, secured</span>' : n.secured ? '<span style="font-size:10.5px;opacity:.55">Secured</span>' : '<span style="font-size:10.5px;opacity:.55">Open</span>'}
      </span>
      ${n.connected ? `<span style="opacity:.7">${'▮'.repeat(n.bars)}</span>` : `<span style="opacity:.45">${'▮'.repeat(n.bars)}</span>`}`;
    row.addEventListener('click', () => {
      notify({ title: n.name, body: n.connected ? 'Already connected to this network.' : `Connecting to ${n.name}…`, icon: 'wifi' });
      closeTrayFlyout();
    });
    row.addEventListener('pointerenter', () => row.style.background = 'rgba(255,255,255,.08)');
    row.addEventListener('pointerleave', () => row.style.background = 'transparent');
    listEl.append(row);
  });
  wrap.querySelector('[data-act=toggle]').addEventListener('click', (e) => {
    updateSettings({ wifi: !state.settings.wifi });
    const dot = e.currentTarget.firstElementChild;
    e.currentTarget.style.background = state.settings.wifi ? 'var(--accent)' : '#777';
    dot.style.left = state.settings.wifi ? '19px' : '3px';
    document.getElementById('tray-net').style.opacity = state.settings.wifi ? '1' : '.45';
  });
  wrap.querySelector('.tray-list + div button').addEventListener('click', () => { closeTrayFlyout(); openApp('settings', { page: 'network' }); });
  showTrayFlyout(anchor, wrap, 300);
}

function volumeFlyout(anchor) {
  const wrap = el('div', { style: 'padding:12px 14px' });
  wrap.innerHTML = `<div style="font-size:12.5px;margin-bottom:10px">Speakers (Browser Audio Device)</div>
    <div style="display:flex;align-items:center;gap:10px">
      <span style="width:16px;height:16px">${icon('volume')}</span>
      <input id="vol-range" type="range" min="0" max="100" value="${state.settings.volume}" style="flex:1;accent-color:var(--accent)">
      <span id="vol-val" style="font-size:11px;width:26px;text-align:right;opacity:.75">${state.settings.volume}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:12px;align-items:center;font-size:12px">
      <span style="display:flex;gap:8px;align-items:center"><span style="width:14px;height:14px;display:inline-flex">${icon('volume')}</span>Mixer</span>
      <span style="opacity:.65">No sound device output in this sandbox</span>
    </div>`;
  wrap.querySelector('#vol-range').addEventListener('input', (e) => {
    const v = +e.target.value;
    updateSettings({ volume: v });
    wrap.querySelector('#vol-val').textContent = v;
    document.getElementById('tray-vol').title = `Speakers: ${v}%`;
    document.getElementById('tray-vol').style.opacity = v === 0 ? '.45' : '1';
  });
  showTrayFlyout(anchor, wrap, 300);
}

function batteryFlyout(anchor) {
  const wrap = el('div', { style: 'padding:14px 16px;font-size:12px' });
  wrap.innerHTML = `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <span style="width:20px;height:20px;display:inline-flex">${icon('battery')}</span><b style="font-size:20px;font-weight:400">92%</b>
    </div>
    <div style="opacity:.7;margin-bottom:12px">About 3 h 40 min remaining (100%)</div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Power mode</span><span style="opacity:.7">Balanced</span></div>
    <div style="height:4px;background:rgba(255,255,255,.15);border-radius:2px"><div style="width:62%;height:100%;background:var(--accent-2);border-radius:2px"></div></div>
    <div style="margin-top:14px;padding-top:10px;border-top:1px solid rgba(255,255,255,.12);opacity:.7">Battery saver: off</div>`;
  showTrayFlyout(anchor, wrap, 290);
}

function hiddenIconsFlyout(anchor) {
  const wrap = el('div', { style: 'padding:8px' });
  const items = [
    { icon: 'onedrive', name: 'OneDrive — Up to date', sub: 'Cloud sync active' },
    { icon: 'shield', name: 'Windows Security', sub: 'No actions needed' },
    { icon: 'volume', name: 'Realtek Audio', sub: 'Ready' },
    { icon: 'windows', name: 'Windows Update', sub: 'You are up to date' },
  ];
  items.forEach((it) => {
    const row = el('div', { style: rowStyle });
    row.innerHTML = `<span style="width:20px;height:20px;display:inline-flex">${icon(it.icon)}</span>
      <span style="display:flex;flex-direction:column;gap:1px"><span>${it.name}</span><span style="font-size:10.5px;opacity:.55">${it.sub}</span></span>`;
    row.addEventListener('pointerenter', () => row.style.background = 'rgba(255,255,255,.08)');
    row.addEventListener('pointerleave', () => row.style.background = 'transparent');
    wrap.append(row);
  });
  const foot = el('button', { style: 'width:100%;text-align:left;padding:8px 12px;font-size:12px;border-top:1px solid rgba(255,255,255,.12);margin-top:4px' });
  foot.textContent = 'Customize…';
  foot.addEventListener('click', () => { closeTrayFlyout(); openApp('settings', { page: 'personalization' }); });
  wrap.append(foot);
  showTrayFlyout(anchor, wrap, 290);
}

function languageFlyout(anchor) {
  const wrap = el('div', { style: 'padding:8px' });
  ['English (United States)', 'Français (France)', 'Español (España)'].forEach((l, i) => {
    const row = el('div', { style: rowStyle + ';justify-content:space-between' });
    row.innerHTML = `<span>${l}</span>${i === 0 ? `<span style="width:14px;height:14px">${icon('check')}</span>` : ''}`;
    row.addEventListener('click', () => { closeTrayFlyout(); notify({ title: 'Language', body: `Keyboard layout switched to ${l} (demo).`, icon: 'keyboard' }); });
    row.addEventListener('pointerenter', () => row.style.background = 'rgba(255,255,255,.08)');
    row.addEventListener('pointerleave', () => row.style.background = 'transparent');
    wrap.append(row);
  });
  showTrayFlyout(anchor, wrap, 250);
}

/* ------------------------------ init ------------------------------ */
export function initTaskbar() {
  tickClock();
  setInterval(tickClock, 1000);
  refreshTasks();
  updateNotifBadge();

  document.getElementById('tray-net').addEventListener('click', (e) => networkFlyout(e.currentTarget));
  document.getElementById('tray-vol').addEventListener('click', (e) => volumeFlyout(e.currentTarget));
  document.getElementById('tray-battery').addEventListener('click', (e) => batteryFlyout(e.currentTarget));
  document.getElementById('tray-icons').addEventListener('click', (e) => hiddenIconsFlyout(e.currentTarget));
  document.getElementById('tray-lang').addEventListener('click', (e) => languageFlyout(e.currentTarget));

  document.getElementById('tray-showdesk').addEventListener('click', () => {
    if (visibleWindows().length) {
      minimizeAll();
      lastShowDesktop = Date.now();
    } else restoreAll();
  });
  document.getElementById('tray-showdesk').addEventListener('dblclick', () => restoreAll());

  bus.on('win:changed', () => { refreshTasks(); hidePreview(); });
  bus.on('taskbar:refresh', refreshTasks);
  bus.on('notif:changed', updateNotifBadge);
  bus.on('settings:changed', refreshTasks);

  // right-click on taskbar
  document.getElementById('taskbar').addEventListener('contextmenu', (e) => {
    if (e.target.closest('.task')) return;
    e.preventDefault();
    openMenu(e.clientX, e.clientY, [
      { label: 'Show desktop icons', checked: state.settings.showDesktopIcons, action: () => {
        state.settings.showDesktopIcons = !state.settings.showDesktopIcons;
        save();
        document.getElementById('desktop-icons').style.display = state.settings.showDesktopIcons ? 'block' : 'none';
      } },
      { label: 'Task Manager', icon: 'taskmgr', action: () => openApp('taskmanager') },
      'sep',
      { label: 'Taskbar settings', icon: 'settings', action: () => openApp('settings', { page: 'taskbar' }) },
    ], { dark: true });
  });

  // the show-desktop strip is razor thin: make hovering it obvious
  const sd = document.getElementById('tray-showdesk');
  sd.addEventListener('pointerenter', () => { sd.style.background = 'rgba(255,255,255,.18)'; });
  sd.addEventListener('pointerleave', () => { sd.style.background = 'transparent'; });
}
