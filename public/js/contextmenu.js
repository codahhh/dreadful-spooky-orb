/* ============================================================
   Context menu system with nested submenus
   ============================================================ */

import { icon } from './icons.js';
import { el } from './utils.js';

let menus = [];
let closeTimer = null;
const root = () => document.getElementById('context-menu');

function cleanup() {
  menus.forEach((m) => m.remove());
  menus = [];
  const r = root();
  if (r) r.hidden = true;
}

export function closeMenus() {
  clearTimeout(closeTimer);
  cleanup();
  document.removeEventListener('pointerdown', onOutside, true);
  document.removeEventListener('keydown', onKey, true);
}

function onOutside(e) {
  if (!menus.some((m) => m.contains(e.target)) && !e.target.closest('.win-btn')) closeMenus();
}
function onKey(e) {
  if (e.key === 'Escape') { e.stopPropagation(); closeMenus(); }
}

function buildMenu(items, x, y, opts = {}) {
  const menu = el('div', { class: 'menu' });
  menu.style.minWidth = (opts.minWidth || 190) + 'px';
  if (opts.dark) { menu.style.background = 'rgba(38,38,38,.98)'; menu.style.color = '#f0f0f0'; menu.style.borderColor = 'rgba(255,255,255,.16)'; }
  for (const item of items) {
    if (!item) continue;
    if (item === 'sep' || item.sep) { menu.append(el('div', { class: 'menu-sep' })); continue; }
    if (item.labelOnly) { menu.append(el('div', { class: 'menu-label', text: item.label })); continue; }
    const row = el('button', {
      class: 'menu-item' + (item.disabled ? ' disabled' : '') + (item.danger ? ' danger' : ''),
      type: 'button',
    });
    if (item.checked) row.innerHTML = `<span class="mi-ico">${icon('check')}</span>`;
    else if (item.icon) row.innerHTML = `<span class="mi-ico">${icon(item.icon)}</span>`;
    else row.innerHTML = `<span class="mi-ico"></span>`;
    row.append(el('span', { text: item.label }));
    if (item.submenu) row.append(el('span', { class: 'mi-arrow', text: '›' }));
    else if (item.shortcut) row.append(el('span', { class: 'mi-key', text: item.shortcut }));

    if (item.disabled) {
      row.addEventListener('click', (e) => e.stopPropagation());
    } else if (item.submenu) {
      let sub = null;
      const openSub = () => {
        clearTimeout(closeTimer);
        if (sub) return;
        const r = row.getBoundingClientRect();
        sub = buildMenu(item.submenu, r.right - 3, r.top - 4, { minWidth: opts.minWidth || 190, dark: opts.dark });
        sub.dataset.parent = '1';
        menus.push(sub);
      };
      row.addEventListener('pointerenter', () => { clearTimeout(closeTimer); closeTimer = setTimeout(openSub, 90); });
      row.addEventListener('pointerleave', () => {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          const idx = menus.indexOf(sub);
          if (sub && idx > 0) { sub.remove(); menus.splice(idx, 1); sub = null; }
        }, 320);
      });
      row.addEventListener('click', (e) => { e.stopPropagation(); openSub(); });
    } else {
      row.addEventListener('pointerenter', () => {
        clearTimeout(closeTimer);
        // close any open submenus when moving onto a leaf
        const r = root();
        menus.filter((m) => m !== r && m.dataset.parent).forEach((m) => { m.remove(); menus = menus.filter((x) => x !== m); });
      });
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenus();
        item.action?.();
      });
    }
    menu.append(row);
  }
  document.getElementById('screen').append(menu);
  // position within viewport
  const rect = menu.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 6;
  const maxY = window.innerHeight - rect.height - 6;
  menu.style.left = Math.max(4, Math.min(x, maxX)) + 'px';
  menu.style.top = Math.max(4, Math.min(y, maxY)) + 'px';
  menus.push(menu);
  return menu;
}

export function openMenu(x, y, items, opts = {}) {
  closeMenus();
  const menu = buildMenu(items, x, y, opts);
  const r = root();
  if (r) r.hidden = true;
  document.addEventListener('pointerdown', onOutside, true);
  document.addEventListener('keydown', onKey, true);
  return menu;
}

/** attach a context-menu handler */
export function bindContext(target, handler, opts = {}) {
  target.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const items = typeof handler === 'function' ? handler(e) : handler;
    if (!items) return;
    openMenu(e.clientX, e.clientY, items, opts);
  });
}
