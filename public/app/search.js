/* ============================================================
   Search panel: apps, files, settings and a little fake web
   ============================================================ */

import { state } from './store.js';
import { icon } from './icons.js';
import { el, esc, bus, fileIconName } from './utils.js';
import { allApps } from './apps/registry.js';
import { openApp } from './launcher.js';

const panel = () => document.getElementById('search-panel');
let open = false;
let results = [];
let hl = 0;

const SETTINGS_PAGES = [
  { id: 'display', name: 'Display settings', icon: 'display' },
  { id: 'personalization', name: 'Personalization', icon: 'personalization' },
  { id: 'taskbar', name: 'Taskbar settings', icon: 'view' },
  { id: 'apps', name: 'Apps & features', icon: 'apps' },
  { id: 'accounts', name: 'Accounts', icon: 'accounts' },
  { id: 'time', name: 'Time & language', icon: 'time' },
  { id: 'privacy', name: 'Privacy', icon: 'privacy' },
  { id: 'update', name: 'Windows Update', icon: 'update' },
  { id: 'about', name: 'About your PC', icon: 'info' },
  { id: 'network', name: 'Network & Internet', icon: 'wifi' },
];

const WEB_JOKES = [
  'how to close a window that will not close',
  'why is my taskbar blue',
  'windows 10 wallpaper original',
  'best minesweeper strategies',
  'what does Ctrl+Shift+Esc do',
  'how to install more RAM',
  'spooky orb screensaver download',
];

function walk(node, dirPath, out) {
  if (!node.children) return;
  for (const child of node.children) {
    if (child.type === 'drive') continue;
    const p = child.type === 'drive' ? child.name : (dirPath ? dirPath + '\\' + child.name : child.name);
    if (child.type === 'file') out.push({ name: child.name, path: p });
    else if (child.children) walk(child, p, out);
  }
}

function allFiles() {
  const out = [];
  state.fs.children.forEach((drive) => walk(drive, drive.letter || drive.name, out));
  return out;
}

function escNeedle(s) { return s.toLowerCase().trim(); }

function compute(q) {
  const query = escNeedle(q);
  const apps = allApps().filter((a) => a.name.toLowerCase().includes(query)).slice(0, 5)
    .map((a) => ({ type: 'app', name: a.name, icon: a.icon, sub: 'App', action: () => openApp(a.id) }));
  const settings = SETTINGS_PAGES.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 3)
    .map((p) => ({ type: 'settings', name: p.name, icon: p.icon, sub: 'Settings', action: () => openApp('settings', { page: p.id }) }));
  const files = allFiles().filter((f) => f.name.toLowerCase().includes(query)).slice(0, 6)
    .map((f) => ({ type: 'file', name: f.name, icon: fileIconName(f.name), sub: f.path, action: () => openApp('explorer', { path: f.path, select: f.name }) }));
  return [...apps, ...settings, ...files];
}

function render(q = '') {
  const root = panel();
  const query = q.trim();
  const body = root.querySelector('.sp-body');
  results = [];
  hl = 0;

  if (!query) {
    const top = ['edge', 'explorer', 'notepad', 'settings', 'calculator', 'paint', 'photos', 'terminal', 'minesweeper'].map((id) => allApps().find((a) => a.id === id)).filter(Boolean);
    const web = WEB_JOKES.slice(0, 4);
    body.innerHTML = `
      <div class="sp-sec">Top apps</div>
      <div class="sp-top">
        ${top.slice(0, 6).map((a) => `<button class="sp-tile" data-app="${a.id}"><span style="width:28px;height:28px;display:inline-flex">${icon(a.icon)}</span><span>${esc(a.name)}</span></button>`).join('')}
      </div>
      <div class="sp-sec">Recent</div>
      ${['Welcome.txt', 'ideas.txt', 'notes.md'].map((n) => `
        <button class="sp-row" data-recent="${esc(n)}">
          <span class="s-ico">${icon('notepad')}</span><span>${n}</span><span class="s-sub">Text Document</span>
        </button>`).join('')}
      <div class="sp-sec">Search the web</div>
      ${web.map((w) => `<button class="sp-row sp-web" data-web="${esc(w)}"><span class="s-ico" style="width:18px;height:18px">${icon('globe')}</span><span>${esc(w)}</span></button>`).join('')}
    `;
    body.querySelectorAll('[data-app]').forEach((b) => b.addEventListener('click', () => { openApp(b.dataset.app); closeSearch(); }));
    body.querySelectorAll('[data-recent]').forEach((b) => b.addEventListener('click', () => {
      const name = b.dataset.recent;
      const path = 'C:\\Users\\Alex\\Documents\\' + name;
      openApp('notepad', { path });
      closeSearch();
    }));
    body.querySelectorAll('[data-web]').forEach((b) => b.addEventListener('click', () => { openApp('edge', { query: b.dataset.web }); closeSearch(); }));
    return;
  }

  results = compute(query);
  const webQ = encodeURIComponent(query);
  let html = '';
  if (results.length) {
    html += `<div class="sp-sec">Results for "${esc(query)}"</div>`;
    results.forEach((r, i) => {
      html += `<button class="sp-row${i === 0 ? ' hl' : ''}" data-i="${i}">
        <span class="s-ico">${icon(r.icon)}</span>
        <span style="display:flex;flex-direction:column;gap:1px;min-width:0">
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.name)}</span>
          <span style="font-size:10.5px;color:#9a9a9a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.sub)}</span>
        </span>
        <span class="s-sub">${r.type === 'app' ? 'App' : r.type === 'settings' ? 'Settings' : 'File'}</span>
      </button>`;
    });
  } else {
    html += `<div class="sp-empty">No results for "${esc(query)}" in apps, settings or your files.</div>`;
  }
  html += `<div class="sp-sec">Web results</div>
    <button class="sp-row sp-web" data-web="${esc(query)}"><span class="s-ico" style="width:18px;height:18px">${icon('globe')}</span>
      <span>See web results for "${esc(query)}"</span><span class="s-sub">Bing</span></button>`;

  body.innerHTML = html;
  body.querySelectorAll('[data-i]').forEach((b) => {
    b.addEventListener('click', () => { results[+b.dataset.i]?.action(); closeSearch(); });
  });
  body.querySelector('[data-web]')?.addEventListener('click', () => { openApp('edge', { query }); closeSearch(); });
}

function moveHl(dir) {
  const rows = panel().querySelectorAll('.sp-body .sp-row');
  if (!rows.length) return;
  rows.forEach((r) => r.classList.remove('hl'));
  hl = (hl + dir + rows.length) % rows.length;
  rows[hl].classList.add('hl');
  rows[hl].scrollIntoView({ block: 'nearest' });
}

export function showSearch(initial = '') {
  const root = panel();
  root.hidden = false;
  open = true;
  bus.emit('shell:panel', 'search');
  root.innerHTML = `
    <div class="sp-head">
      <span style="width:18px;height:18px;display:inline-flex;opacity:.7">${icon('search')}</span>
      <input id="sp-input" placeholder="Search the web and Windows" autocomplete="off" spellcheck="false" value="${esc(initial)}">
      <button class="sp-close" title="Close" style="width:24px;height:24px;display:grid;place-items:center;color:#bbb">${icon('close')}</button>
    </div>
    <div class="sp-body"></div>
    <div class="sp-foot"><span><span class="kbd">↑</span> <span class="kbd">↓</span> to navigate · <span class="kbd">Enter</span> to open</span><span>Cortana is on a coffee break</span></div>`;
  const input = root.querySelector('#sp-input');
  render(initial);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  document.getElementById('search-btn').classList.add('active');

  input.addEventListener('input', () => render(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveHl(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveHl(-1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const raw = input.value.trim();
      const rows = root.querySelectorAll('.sp-body .sp-row');
      const active = rows[hl];
      if (raw && active) active.click();
      else if (raw) { openApp('edge', { query: raw }); closeSearch(); }
    } else if (e.key === 'Escape') { e.stopPropagation(); closeSearch(); }
  });
  root.querySelector('.sp-close').addEventListener('click', closeSearch);
  setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
}

export function closeSearch() {
  panel().hidden = true;
  open = false;
  document.getElementById('search-btn').classList.remove('active');
  document.removeEventListener('pointerdown', outside, true);
}
export function toggleSearch() { open ? closeSearch() : showSearch(); }
export function isSearchOpen() { return open; }

function outside(e) {
  const t = e.target instanceof Element ? e.target : null;
  if (!t || panel().contains(t) || t.closest('#search-btn')) return;
  if (e.target.closest('.menu')) return;
  closeSearch();
}
