/* ============================================================
   Start menu
   ============================================================ */

import { state, save, updateSettings } from './store.js';
import { icon } from './icons.js';
import { el, esc, bus } from './utils.js';
import { allApps, appMeta } from './apps/registry.js';
import { openApp } from './launcher.js';
import { openMenu } from './contextmenu.js';
import { notify } from './notify.js';
import { showSearch } from './search.js';

const menu = () => document.getElementById('start-menu');
let open = false;

const TILE_GRADIENT = {
  weather: 'linear-gradient(150deg,#2b7fd4,#0d3f77)',
  store: 'linear-gradient(150deg,#0f7a4d,#0b4a2f)',
  mail: 'linear-gradient(150deg,#0a6ebd,#08477a)',
  calendar: 'linear-gradient(150deg,#b3341f,#6d1d10)',
  photos: 'linear-gradient(150deg,#0e7c9c,#0a4c60)',
  settings: 'linear-gradient(150deg,#4b4b4b,#2a2a2a)',
  media: 'linear-gradient(150deg,#8a4dff,#3a1b6e)',
  edge: 'linear-gradient(150deg,#0f8fbf,#0a4f77)',
  minesweeper: 'linear-gradient(150deg,#6d6d6d,#3a3a3a)',
  taskmanager: 'linear-gradient(150deg,#2a5f9e,#173a63)',
  notepad: 'linear-gradient(150deg,#4a7fb5,#254c73)',
  paint: 'linear-gradient(150deg,#c25a2c,#6d2f14)',
  terminal: 'linear-gradient(150deg,#333941,#121519)',
  explorer: 'linear-gradient(150deg,#c9a227,#7d6313)',
  recycle: 'linear-gradient(150deg,#4b6b83,#243542)',
};

function tilesHtml() {
  return (state.settings.startTiles || []).map((t, idx) => {
    const meta = appMeta(t.appId);
    if (!meta) return '';
    const size = t.size === 'medium' ? ' medium' : t.size === 'wide' ? ' wide' : ' small';
    const bg = TILE_GRADIENT[t.appId] ? `background:${TILE_GRADIENT[t.appId]}` : '';
    let extra = '';
    if (t.appId === 'weather') {
      extra = `<div class="t-big">18°</div><div class="t-sub" style="position:absolute;left:9px;bottom:22px">Partly cloudy</div>`;
    } else if (t.appId === 'calendar') {
      const d = new Date();
      extra = `<div class="t-big">${d.getDate()}</div><div class="t-sub" style="position:absolute;left:9px;bottom:21px">${d.toLocaleDateString([], { weekday: 'short', month: 'short' })}</div>`;
    } else if (t.appId === 'mail') {
      extra = `<div class="t-big">3</div><div class="t-sub" style="position:absolute;left:9px;bottom:21px">Unread</div>`;
    } else if (t.appId === 'store') {
      extra = `<div class="t-sub" style="position:absolute;left:9px;bottom:21px">New apps</div>`;
    } else if (t.appId === 'photos') {
      extra = `<div class="t-sub" style="position:absolute;left:9px;bottom:21px">5 photos</div>`;
    }
    return `<button class="tile${size}${extra ? ' live' : ''}" data-tile="${idx}" data-app="${t.appId}" style="${bg}">
      ${extra ? '' : `<span class="t-ico">${icon(meta.icon)}</span>`}
      <span class="t-name" style="position:absolute;left:9px;bottom:7px;right:9px">${esc(meta.name)}</span>
    </button>`;
  }).join('');
}

function render() {
  const root = menu();
  const apps = allApps().sort((a, b) => a.name.localeCompare(b.name));
  let lastLetter = '';
  const list = apps.map((a) => {
    const letter = a.name[0].toUpperCase();
    const head = letter !== lastLetter ? `<div class="sm-letter">${letter}</div>` : '';
    lastLetter = letter;
    return `${head}<button class="sm-app" data-app="${a.id}"><span style="width:20px;height:20px;display:inline-flex">${icon(a.icon)}</span><span>${esc(a.name)}</span></button>`;
  }).join('');

  root.innerHTML = `
    <div class="sm-rail">
      <button class="sm-user" id="sm-user" title="Account">${esc((state.settings.userName || 'A')[0].toUpperCase())}</button>
      <button id="sm-docs" title="Documents">${icon('documents')}</button>
      <button id="sm-pics" title="Pictures">${icon('pictures')}</button>
      <div class="spacer"></div>
      <button id="sm-settings" title="Settings">${icon('settings')}</button>
      <button id="sm-power" title="Power">${icon('power')}</button>
    </div>
    <div class="sm-main">
      <div class="sm-apps" id="sm-apps">
        <button class="sm-search-mini" id="sm-search-open">${icon('search')}<span>Search apps, files and settings</span></button>
        ${list}
        <div style="height:8px"></div>
      </div>
    </div>
    <div class="sm-right">
      <div class="sm-tiles">${tilesHtml()}</div>
      <div class="sm-footer" style="justify-content:space-between;font-size:10.5px;color:#8d8d8d;padding-top:8px">
        <span>Pinned</span>
        <button id="sm-settings2" title="Settings" style="width:22px;height:22px;opacity:.55">${icon('settings')}</button>
      </div>
    </div>`;
  bind();
}

function bind() {
  const root = menu();
  root.querySelectorAll('[data-app]').forEach((b) => {
    b.addEventListener('click', () => {
      openApp(b.dataset.app);
      closeStart();
    });
  });
  root.querySelectorAll('.sm-app').forEach((b) => {
    b.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = b.dataset.app;
      const meta = appMeta(id);
      const pinnedTask = state.settings.taskbarPinned.includes(id);
      const hasTile = (state.settings.startTiles || []).some((t) => t.appId === id);
      openMenu(e.clientX, e.clientY, [
        { label: `Open ${meta?.name || id}`, icon: meta?.icon || 'file', action: () => { openApp(id); closeStart(); } },
        'sep',
        hasTile
          ? { label: 'Unpin from Start', icon: 'close', action: () => { state.settings.startTiles = state.settings.startTiles.filter((t) => t.appId !== id); save(); render(); } }
          : { label: 'Pin to Start', icon: 'pin', action: () => { state.settings.startTiles.push({ appId: id, size: 'small' }); save(); render(); } },
        { label: pinnedTask ? 'Unpin from taskbar' : 'Pin to taskbar', icon: 'pin', action: () => {
          const p = new Set(state.settings.taskbarPinned);
          if (p.has(id)) p.delete(id); else p.add(id);
          updateSettings({ taskbarPinned: [...p] });
        } },
      ], { dark: true });
    });
  });
  const tileApps = root.querySelectorAll('.tile');
  tileApps.forEach((tile) => {
    tile.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const idx = +tile.dataset.tile;
      const t = state.settings.startTiles[idx];
      openMenu(e.clientX, e.clientY, [
        { label: 'Unpin from Start', icon: 'close', action: () => {
          state.settings.startTiles.splice(idx, 1);
          save(); render();
        } },
        { label: 'Resize', icon: 'grid', submenu: [
          { label: 'Small', checked: t.size === 'small', action: () => { t.size = 'small'; save(); render(); } },
          { label: 'Medium', checked: t.size === 'medium', action: () => { t.size = 'medium'; save(); render(); } },
          { label: 'Wide', checked: t.size === 'wide', action: () => { t.size = 'wide'; save(); render(); } },
        ] },
        'sep',
        { label: 'Open', icon: 'open', action: () => { openApp(t.appId); closeStart(); } },
      ], { dark: true });
    });
  });

  root.querySelector('#sm-docs').addEventListener('click', () => { openApp('explorer', { path: 'C:\\Users\\Alex\\Documents' }); closeStart(); });
  root.querySelector('#sm-pics').addEventListener('click', () => { openApp('explorer', { path: 'C:\\Users\\Alex\\Pictures' }); closeStart(); });
  root.querySelector('#sm-settings').addEventListener('click', () => { openApp('settings'); closeStart(); });
  root.querySelector('#sm-settings2').addEventListener('click', () => { openApp('settings'); closeStart(); });
  root.querySelector('#sm-search-open').addEventListener('click', () => { closeStart(); showSearch(); });

  root.querySelector('#sm-user').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    openMenu(r.right + 8, r.top - 120, [
      { label: state.settings.userName, labelOnly: true },
      { label: 'Change account settings', icon: 'accounts', action: () => { openApp('settings', { page: 'accounts' }); closeStart(); } },
      { label: 'Lock', icon: 'lock', shortcut: 'Win+L', action: () => { closeStart(); bus.emit('session:lock'); } },
      { label: 'Sign out', icon: 'user', action: () => { closeStart(); bus.emit('session:signout'); } },
    ], { dark: true });
  });

  root.querySelector('#sm-power').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    openMenu(r.right + 8, r.top - 96, [
      { label: 'Sleep', icon: 'sleep', action: () => { closeStart(); bus.emit('session:sleep'); } },
      { label: 'Shut down', icon: 'power', action: () => { closeStart(); bus.emit('power:action', 'shutdown'); } },
      { label: 'Restart', icon: 'restart', action: () => { closeStart(); bus.emit('power:action', 'restart'); } },
    ], { dark: true });
  });
}

export function renderStartMenu() { if (open) render(); }

export function openStart() {
  const root = menu();
  root.hidden = false;
  open = true;
  // mark other flyouts closed via bus
  bus.emit('shell:panel', 'start');
  render();
  document.getElementById('start-btn').classList.add('active');
  setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
  document.addEventListener('keydown', onKey, true);
}
export function closeStart() {
  const root = menu();
  root.hidden = true;
  open = false;
  document.getElementById('start-btn').classList.remove('active');
  document.removeEventListener('pointerdown', outside, true);
  document.removeEventListener('keydown', onKey, true);
}
export function toggleStart() {
  if (open) closeStart(); else openStart();
}
export function isStartOpen() { return open; }

function outside(e) {
  const root = menu();
  const t = e.target instanceof Element ? e.target : null;
  if (!t || root.contains(t) || t.closest('#start-btn')) return;
  if (e.target.closest('.menu')) return;
  closeStart();
}
function onKey(e) {
  if (e.key === 'Escape') { e.stopPropagation(); closeStart(); }
  if (e.key === 'Escape' || e.key === 'Meta') closeStart();
}

bus.on('settings:changed', () => { if (open) render(); });
bus.on('notif:changed', () => { if (open) render(); });
