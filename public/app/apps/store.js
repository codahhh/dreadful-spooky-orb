/* ============================================================
   Microsoft Store
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { state, save } from '../store.js';
import { notify } from '../notify.js';
import { openApp } from '../launcher.js';
import { allApps } from './registry.js';

export const meta = { id: 'store', name: 'Microsoft Store', icon: 'store' };

const CATALOG = [
  { id: 'minesweeper', ico: 'mine', name: 'Minesweeper', pub: 'Dreadful Games', rating: 4.8, price: 'Free', cat: 'gaming', size: '4.2 MB', age: '3+', updated: '12 March 2026', extra: 'The classic. Now with 100% more orb.', long: 'Clear the board without detonating anything. Three difficulty levels, a real timer, and a best-time board that survives a reload. Right-click plants a flag — on a phone, long-press does.' },
  { id: 'paint', ico: 'paint', name: 'Paint', pub: 'Microsoft Corporation', rating: 4.5, price: 'Free', cat: 'apps', size: '8.8 MB', age: '3+', updated: '2 February 2026', extra: 'Draw something worth saving.', long: 'Brushes, shapes, an eyedropper, undo history, and a canvas that saves straight into your Pictures folder as a real image.' },
  { id: 'notepad', ico: 'notepad', name: 'Notepad', pub: 'Microsoft Corporation', rating: 4.7, price: 'Free', cat: 'apps', size: '1.1 MB', age: '3+', updated: '9 January 2026', extra: 'Plain text, zero distractions.', long: 'Tab stops, word wrap, find and replace, and a word count. Opens .txt and .md, saves wherever you like.' },
  { id: 'calculator', ico: 'calculator', name: 'Calculator', pub: 'Microsoft Corporation', rating: 4.6, price: 'Free', cat: 'apps', size: '2.4 MB', age: '3+', updated: '20 February 2026', extra: 'Standard mode, powered by arithmetic.', long: 'A full keypad, a history tape, keyboard entry and memory keys. Type numbers instead of tapping them.' },
  { id: 'terminal', ico: 'terminal', name: 'Windows Terminal', pub: 'Microsoft Corporation', rating: 4.9, price: 'Free', cat: 'apps', size: '14.6 MB', age: '12+', updated: '28 February 2026', extra: 'A terminal for people who like terminals.', long: 'PowerShell-flavoured shell with about forty commands: ls, cd, cat, echo, mkdir, rm, paint, calc, neofetch, tree, find and friends.' },
  { id: 'solitaire', ico: 'cards', name: 'Solitaire Collection', pub: 'Dreadful Games', rating: 4.4, price: 'Free', cat: 'gaming', size: '22.9 MB', age: '3+', updated: 'coming soon', extra: 'Coming soon to this PC.', long: 'Klondike, Spider and FreeCell. Currently stuck behind a suspiciously orb-shaped portal. Wishlisted by 1 person.' },
  { id: 'media', ico: 'media', name: 'Groove Music', pub: 'Microsoft Corporation', rating: 4.1, price: 'Free', cat: 'apps', size: '6.3 MB', age: '3+', updated: '14 February 2026', extra: 'An audio player with excellent taste.', long: 'Six tracks that exist only as a very good lie. Playlists, shuffle, repeat and a visualiser that reacts to nothing at all.' },
  { id: 'weather', ico: 'weather', name: 'Weather', pub: 'Microsoft Corporation', rating: 4.3, price: 'Free', cat: 'apps', size: '3.1 MB', age: '3+', updated: '1 March 2026', extra: 'Seven cities, hourly detail.', long: 'Current conditions, a twelve-hour strip and a seven-day outlook for seven cities. Celsius or Fahrenheit, your call.' },
  { id: 'mail', ico: 'mail', name: 'Mail', pub: 'Microsoft Corporation', rating: 4.0, price: 'Free', cat: 'apps', size: '5.7 MB', age: '3+', updated: '5 March 2026', extra: 'Unread messages, all friendly.', long: 'An inbox with folders, search, unread counts and a composer that actually sends (to a fake address, but it sends).' },
  { id: 'photos', ico: 'photos', name: 'Photos', pub: 'Microsoft Corporation', rating: 4.2, price: 'Free', cat: 'apps', size: '9.4 MB', age: '3+', updated: '18 February 2026', extra: 'Albums, viewer, slideshow.', long: 'Everything in your Pictures folder, plus albums, search, a full-screen viewer and an Edit in Paint button that works.' },
  { id: 'xbox', ico: 'xbox', name: 'Xbox Console Companion', pub: 'Microsoft Corporation', rating: 3.9, price: 'Free', cat: 'gaming', size: '48.2 MB', age: '12+', updated: 'out of support', extra: 'No consoles detected.', long: 'Scans the local network for consoles, finds none, and politely suggests you play Minesweeper instead.' },
  { id: 'news', ico: 'news', name: 'News', pub: 'Microsoft Corporation', rating: 3.6, price: 'Free', cat: 'apps', size: '11.0 MB', age: '12+', updated: '22 January 2026', extra: 'Headlines from a parallel universe.', long: 'A front page of stories that only exist here: orb sightings, taskbar alignment policy, and a report on someone who finished Minesweeper.' },
  { id: 'cloud', ico: 'cloud', name: 'OneDrive', pub: 'Microsoft Corporation', rating: 4.0, price: 'Free', cat: 'apps', size: '7.9 MB', age: '3+', updated: '3 March 2026', extra: 'Your files, in the sky.', long: 'Syncs exactly nothing, because everything already lives in this browser. Comforting, in its way.' },
  { id: 'camera', ico: 'display', name: 'Camera', pub: 'Microsoft Corporation', rating: 3.2, price: 'Free', cat: 'apps', size: '3.4 MB', age: '3+', updated: '11 December 2025', extra: 'No camera detected. Or is there?', long: 'Would show you a photo of yourself if this sandbox had a webcam. Falls back to a very calm blue rectangle.' },
  { id: 'clock', ico: 'clock', name: 'Alarms & Clock', pub: 'Microsoft Corporation', rating: 4.1, price: 'Free', cat: 'apps', size: '2.8 MB', age: '3+', updated: '16 January 2026', extra: 'World clock, timers, alarms.', long: 'Four world clocks, a stopwatch and a timer that will absolutely tell you when the noodles are done.' },
  { id: 'keyboard', ico: 'keyboard', name: 'Touch Keyboard', pub: 'Microsoft Corporation', rating: 3.5, price: 'Free', cat: 'apps', size: '1.9 MB', age: '3+', updated: '7 February 2026', extra: 'For devices without keys.', long: 'An on-screen keyboard with every layout you would expect, and the one shortcut nobody can remember.' },
];

const TABS = [['home', 'Home'], ['apps', 'Apps'], ['gaming', 'Gaming'], ['library', 'Library']];

export function launch() {
  const win = createWindow({
    title: 'Microsoft Store', icon: 'store', width: 980, height: 700,
    minWidth: 520, minHeight: 400, appId: 'store', instanceKey: 'store',
  });

  let tab = 'home';
  let query = '';
  let detail = null;

  function card(c, isInstalled, isExtra) {
    return `<button class="store-card" data-open="${c.id}" style="text-align:left;color:inherit;background:var(--win-bg);border:1px solid var(--line);cursor:default">
      <span style="width:40px;height:40px;display:inline-flex;flex:0 0 40px">${icon(c.ico)}</span>
      <div class="sc-main">
        <b>${esc(c.name)}</b>
        <span>${esc(c.pub)} · ★ ${c.rating}</span>
      </div>
      <span class="btn${isInstalled || isExtra ? '' : ' primary'}" style="pointer-events:none">${isInstalled ? 'Open' : isExtra ? 'Installed' : c.price}</span>
    </button>`;
  }

  function renderDetail(c, isInstalled, isExtra) {
    return `<div style="position:absolute;inset:0;background:var(--win-bg);display:flex;flex-direction:column;z-index:4;overflow:auto">
      <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line)">
        <button class="tb-icon" id="sd-back" title="Back">${icon('back')}</button>
        <b style="font-size:13px">${esc(c.name)}</b>
      </div>
      <div style="display:flex;gap:18px;padding:18px 20px;flex-wrap:wrap">
        <span style="width:96px;height:96px;display:inline-flex;flex:0 0 96px">${icon(c.ico, 96)}</span>
        <div style="min-width:220px;flex:1">
          <h2 style="margin:0 0 4px;font-size:20px;font-weight:600">${esc(c.name)}</h2>
          <div style="font-size:12px;color:var(--muted)">${esc(c.pub)}</div>
          <div style="display:flex;gap:14px;margin:10px 0;font-size:11.5px;color:var(--muted);flex-wrap:wrap">
            <span>★ ${c.rating} rating</span><span>${esc(c.age)}</span><span>${esc(c.size)}</span><span>${esc(c.cat)}</span>
          </div>
          <button class="btn primary" id="sd-action" style="height:32px;padding:0 18px">${isInstalled ? 'Open' : isExtra ? 'Installed' : 'Get'}</button>
          <div style="font-size:10.5px;color:var(--muted);margin-top:6px">Updated ${esc(c.updated)}</div>
        </div>
      </div>
      <div style="padding:0 20px 16px">
        <p style="font-size:13px;line-height:1.55;margin:0 0 14px;max-width:640px">${esc(c.long || c.extra)}</p>
        <div style="font-size:12px;font-weight:600;margin-bottom:8px">Screenshots</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;max-width:720px">
          ${[0, 1, 2].map((i) => `<div style="height:96px;border:1px solid var(--line);border-radius:4px;display:grid;place-items:center;background:linear-gradient(${120 + i * 40}deg, rgba(0,120,215,.16), rgba(0,0,0,.06))">
            <span style="width:38px;height:38px;display:inline-flex;opacity:.85">${icon(c.ico)}</span>
          </div>`).join('')}
        </div>
        <div style="margin-top:16px;font-size:11.5px;color:var(--muted);max-width:640px">
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dotted var(--line)"><span>Category</span><span>${esc(c.cat)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dotted var(--line)"><span>Size</span><span>${esc(c.size)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dotted var(--line)"><span>Last updated</span><span>${esc(c.updated)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Publisher</span><span>${esc(c.pub)}</span></div>
        </div>
      </div>
    </div>`;
  }

  function render() {
    const installed = new Set(allApps().map((a) => a.id));
    const extra = state.installed || [];
    let list = CATALOG;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.pub.toLowerCase().includes(q) || c.extra.toLowerCase().includes(q));
    }
    if (tab === 'apps' || tab === 'gaming') list = list.filter((c) => c.cat === tab);
    if (tab === 'library') list = list.filter((c) => installed.has(c.id) || extra.includes(c.id));

    const featured = CATALOG.find((c) => c.id === 'minesweeper');

    win.body.innerHTML = `
      <div class="store" style="position:relative">
        <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--line)">
          <span style="width:20px;height:20px;display:inline-flex">${icon('store')}</span>
          <b style="font-size:13px">Microsoft Store</b>
          <div style="flex:1;max-width:360px;margin-left:20px;display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:16px;height:30px;padding:0 12px">
            ${icon('search')}<input id="store-q" placeholder="Search apps, games and more" style="flex:1;border:0;outline:none;background:transparent;font-size:12px;color:inherit" value="${esc(query)}">
          </div>
          <button class="tb-icon" title="Downloads" style="margin-left:auto">${icon('download2')}</button>
          <button class="tb-icon" title="Account">${icon('user')}</button>
        </div>
        <div class="store-side">
          ${TABS.map(([id, label]) => `<button data-stab="${id}" class="${tab === id ? 'active' : ''}">${label}</button>`).join('')}
        </div>
        ${tab === 'home' && !query ? `<div class="store-hero">
            <h2>Great apps, made in your browser</h2>
            <p>Everything here is already installed. That is the beauty of a closed ecosystem.</p>
            ${featured ? `<button class="btn" data-open="${featured.id}" style="margin-top:10px;height:28px;padding:0 14px">Featured: ${esc(featured.name)}</button>` : ''}
          </div>` : ''}
        ${tab === 'library' ? `<div style="padding:10px 16px;font-size:11.5px;color:var(--muted)">${list.length} installed on this PC</div>` : ''}
        <div class="store-grid">
          ${list.length ? list.map((c) => card(c, installed.has(c.id), extra.includes(c.id))).join('')
            : `<div style="grid-column:1/-1;color:var(--muted);text-align:center;padding:40px;font-size:12.5px">${query ? `No apps match "${esc(query)}".` : 'Nothing installed yet. Visit Apps or Gaming to add something.'}</div>`}
        </div>
        <div class="app-statusbar"><span>${list.length} results · ${CATALOG.length} in the catalogue</span><span style="margin-left:auto">© Dreadful Systems · All apps are free while the orb permits</span></div>
        ${detail ? renderDetail(detail, installed.has(detail.id), extra.includes(detail.id)) : ''}
      </div>`;

    win.body.querySelectorAll('[data-stab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.stab; query = ''; render(); }));

    const q = win.body.querySelector('#store-q');
    q.addEventListener('input', () => {
      query = q.value;
      render();
      const n = win.body.querySelector('#store-q');
      n.focus(); n.setSelectionRange(n.value.length, n.value.length);
    });

    win.body.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
      detail = CATALOG.find((c) => c.id === b.dataset.open) || null;
      render();
    }));

    win.body.querySelector('#sd-back')?.addEventListener('click', () => { detail = null; render(); });

    win.body.querySelector('#sd-action')?.addEventListener('click', (e) => {
      const c = detail;
      if (!c) return;
      if (allApps().some((a) => a.id === c.id)) { openApp(c.id); return; }
      const btn = e.currentTarget;
      btn.textContent = 'Installing…'; btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Installed';
        if (!state.installed) state.installed = [];
        if (!state.installed.includes(c.id)) state.installed.push(c.id);
        save();
        notify({ title: 'Microsoft Store', body: `${c.name} was installed (not really, it is a demo).`, icon: 'store' });
        render();
      }, 1500);
    });
  }

  render();
  return win;
}
