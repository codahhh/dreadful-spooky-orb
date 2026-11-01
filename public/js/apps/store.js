/* ============================================================
   Microsoft Store
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc } from '../utils.js';
import { state, save } from '../store.js';
import { notify } from '../notify.js';
import { openApp } from '../launcher.js';
import { allApps } from './registry.js';

export const meta = { id: 'store', name: 'Microsoft Store', icon: 'store' };

const CATALOG = [
  { id: 'minesweeper', name: 'Minesweeper', pub: 'Dreadful Games', rating: 4.8, price: 'Free', extra: 'The classic. Now with 100% more orb.' },
  { id: 'paint', name: 'Paint', pub: 'Microsoft Corporation', rating: 4.5, price: 'Free', extra: 'Draw something worth saving.' },
  { id: 'notepad', name: 'Notepad', pub: 'Microsoft Corporation', rating: 4.7, price: 'Free', extra: 'Plain text, zero distractions.' },
  { id: 'calculator', name: 'Calculator', pub: 'Microsoft Corporation', rating: 4.6, price: 'Free', extra: 'Standard mode, powered by arithmetic.' },
  { id: 'terminal', name: 'Windows Terminal', pub: 'Microsoft Corporation', rating: 4.9, price: 'Free', extra: 'A terminal for people who like terminals.' },
  { id: 'solitaire', name: 'Solitaire Collection', pub: 'Dreadful Games', rating: 4.4, price: 'Free', extra: 'Coming soon to this PC.' },
  { id: 'media', name: 'Groove Music', pub: 'Microsoft Corporation', rating: 4.1, price: 'Free', extra: 'An audio player with excellent taste.' },
  { id: 'weather', name: 'Weather', pub: 'Microsoft Corporation', rating: 4.3, price: 'Free', extra: '18° and partly cloudy, forever.' },
  { id: 'mail', name: 'Mail', pub: 'Microsoft Corporation', rating: 4.0, price: 'Free', extra: 'Three unread messages, all friendly.' },
  { id: 'xbox', name: 'Xbox Console Companion', pub: 'Microsoft Corporation', rating: 3.9, price: 'Free', extra: 'No consoles detected.' },
];

export function launch() {
  const win = createWindow({
    title: 'Microsoft Store', icon: 'store', width: 940, height: 660,
    minWidth: 560, minHeight: 380, appId: 'store', instanceKey: 'store',
  });

  let tab = 'home';
  let query = '';

  function render() {
    const installed = new Set(allApps().map((a) => a.id));
    const extra = state.installed || [];
    let list = CATALOG;
    if (query) list = list.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
    if (tab === 'library') list = list.filter((c) => installed.has(c.id) || extra.includes(c.id));

    win.body.innerHTML = `
      <div class="store">
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
          ${[['home', 'Home'], ['apps', 'Apps'], ['gaming', 'Gaming'], ['library', 'Library']].map(([id, label]) => `<button data-stab="${id}" class="${tab === id ? 'active' : ''}">${label}</button>`).join('')}
        </div>
        ${tab === 'home' ? `<div class="store-hero"><h2>Great apps, made in your browser</h2><p>Everything here is already installed. That is the beauty of a closed ecosystem.</p></div>` : ''}
        <div class="store-grid">
          ${list.length ? list.map((c) => {
            const isInstalled = installed.has(c.id);
            return `<div class="store-card">
              <span style="width:34px;height:34px;display:inline-flex">${icon(c.id === 'solitaire' ? 'cards' : c.id)}</span>
              <div class="sc-main"><b>${esc(c.name)}</b><span>${c.pub}</span></div>
              <button class="btn${isInstalled ? '' : ' primary'}" data-install="${c.id}">${isInstalled ? 'Open' : c.price}</button>
            </div>`;
          }).join('') : `<div style="grid-column:1/-1;color:var(--muted);text-align:center;padding:40px;font-size:12.5px">No apps match "${esc(query)}".</div>`}
        </div>
        <div class="app-statusbar"><span>${list.length} results</span><span style="margin-left:auto">© Dreadful Systems · All apps are free while the orb permits</span></div>
      </div>`;

    win.body.querySelectorAll('[data-stab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.stab; render(); }));
    const q = win.body.querySelector('#store-q');
    q.addEventListener('input', () => { query = q.value; render(); setTimeout(() => { const n = win.body.querySelector('#store-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 0); });

    win.body.querySelectorAll('[data-install]').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset.install;
        if (allApps().some((a) => a.id === id)) { openApp(id); return; }
        b.textContent = 'Installing…';
        b.disabled = true;
        setTimeout(() => {
          b.textContent = 'Installed';
          if (!state.installed) state.installed = [];
          if (!state.installed.includes(id)) state.installed.push(id);
          save();
          notify({ title: 'Microsoft Store', body: `${id} was installed (not really, it is a demo).`, icon: 'store' });
        }, 1600);
      });
    });
  }

  render();
  return win;
}
