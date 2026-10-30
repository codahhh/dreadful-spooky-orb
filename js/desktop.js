/* ============================================================
   Desktop: grid icons, selection, marquee, drag, context menus
   ============================================================ */

import { state, save, emptyRecycle, recycleSize } from './store.js';
import { icon } from './icons.js';
import { openApp } from './launcher.js';
import { openMenu } from './contextmenu.js';
import { el, clamp, bus, esc } from './utils.js';
import { notify } from './notify.js';
import { blurWindows } from './wm.js';

const PAD = 8;
const TASKBAR = 40;
const CELL = { large: [104, 108], medium: [88, 92], small: [76, 78] };

const iconsEl = () => document.getElementById('desktop-icons');
const desktopEl = () => document.getElementById('desktop');

let selected = new Set();

function cellSize() {
  const s = state.settings.iconSize || 'medium';
  return CELL[s] || CELL.medium;
}

function grid() {
  const [cw, ch] = cellSize();
  const vw = window.innerWidth, vh = window.innerHeight - TASKBAR;
  return { cw, ch, cols: Math.max(1, Math.floor((vw - PAD * 2) / cw)), rows: Math.max(1, Math.floor((vh - PAD * 2) / ch)) };
}

function freeCell(used) {
  const { cols, rows } = grid();
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    if (!used.has(c + ',' + r)) return { col: c, row: r };
  }
  return { col: 0, row: 0 };
}

export function renderDesktop() {
  const host = iconsEl();
  host.innerHTML = '';
  host.style.display = state.settings.showDesktopIcons ? 'block' : 'none';
  host.style.position = 'absolute';
  host.style.inset = '0';
  host.style.display = 'block';
  host.style.padding = '0';
  selected = new Set(state.desktopIcons.filter((i) => i._sel).map((i) => i.id));

  const used = new Set();
  const { cw, ch } = cellSize();

  state.desktopIcons.forEach((ic) => {
    if (ic.col != null && ic.row != null) used.add(ic.col + ',' + ic.row);
  });
  state.desktopIcons.forEach((ic) => {
    if (ic.col == null || ic.row == null) {
      const f = freeCell(used);
      ic.col = f.col; ic.row = f.row;
      used.add(f.col + ',' + f.row);
    }
  });

  state.desktopIcons.forEach((ic) => {
    const node = el('div', {
      class: 'd-icon' + (selected.has(ic.id) ? ' selected' : ''),
      style: {
        left: (PAD + ic.col * cw) + 'px',
        top: (PAD + ic.row * ch) + 'px',
        width: (cw - 4) + 'px',
        height: (ch - 4) + 'px',
        position: 'absolute',
      },
      dataset: { id: ic.id },
      tabindex: '0',
    });
    node.innerHTML = `<div class="ico">${icon(ic.icon || 'file')}</div><div class="lbl">${esc(ic.name)}</div>`;
    if (ic.icon === 'recycle') {
      const n = recycleSize();
      node.querySelector('.ico').style.position = 'relative';
      if (n === 0) node.querySelector('.ico').style.opacity = '.75';
    }
    bindIcon(node, ic);
    host.append(node);
  });
  save();
}

function selectOnly(id) {
  selected = new Set(id ? [id] : []);
  document.querySelectorAll('.d-icon').forEach((n) => n.classList.toggle('selected', selected.has(n.dataset.id)));
}

function openItem(ic) {
  openApp(ic.appId, ic.args || {});
}

function bindIcon(node, ic) {
  node.addEventListener('pointerdown', (e) => {
    if (e.button === 2) {
      if (!selected.has(ic.id)) selectOnly(ic.id);
      return;
    }
    if (e.button !== 0) return;
    e.stopPropagation();
    if (e.ctrlKey) {
      if (selected.has(ic.id)) selected.delete(ic.id); else selected.add(ic.id);
      node.classList.toggle('selected', selected.has(ic.id));
    } else if (!selected.has(ic.id)) {
      selectOnly(ic.id);
    } else {
      node.classList.add('selected');
    }
    startIconDrag(e, ic, node);
  });

  node.addEventListener('dblclick', (e) => { e.stopPropagation(); openItem(ic); });

  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') openItem(ic);
    if (e.key === 'Delete') notify({ title: 'Desktop', body: `"${ic.name}" is a system icon and cannot be deleted.`, icon: 'warning' });
  });

  node.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selected.has(ic.id)) selectOnly(ic.id);
    const items = [
      { label: 'Open', icon: 'open', action: () => openItem(ic) },
      ic.appId === 'explorer' ? { label: 'Open in new window', icon: 'newfile', action: () => openApp('explorer', { path: ic.args?.path, newInstance: true }) } : null,
      'sep',
      { label: 'Pin to Start', icon: 'pin', action: () => {
        state.settings.startTiles = [...(state.settings.startTiles || []), { appId: ic.appId, size: 'small', color: 'settings' }];
        save(); notify({ title: 'Pinned to Start', body: `"${ic.name}" was pinned.`, icon: ic.icon || 'pin' });
      } },
      { label: 'Pin to taskbar', icon: 'pin', action: () => {
        if (!state.settings.taskbarPinned.includes(ic.appId)) state.settings.taskbarPinned.push(ic.appId);
        save(); bus.emit('taskbar:refresh');
        notify({ title: 'Pinned to taskbar', body: `"${ic.name}" was pinned.`, icon: ic.icon || 'pin' });
      } },
      'sep',
      ic.icon === 'recycle'
        ? { label: 'Empty Recycle Bin', icon: 'trash', action: () => { emptyRecycle(); renderDesktop(); notify({ title: 'Recycle Bin', body: 'The Recycle Bin is now empty.', icon: 'recycle' }); } }
        : { label: 'Properties', icon: 'properties', action: () => propertiesFor(ic) },
    ].filter(Boolean);
    openMenu(e.clientX, e.clientY, items);
  });
}

function propertiesFor(ic) {
  notify({ title: ic.name, body: `Type: System folder\nLocation: Desktop\nCreated: 30/10/2024`, icon: ic.icon || 'file', timeout: 6000 });
}

function startIconDrag(e, ic, node) {
  const startX = e.clientX, startY = e.clientY;
  const rect = node.getBoundingClientRect();
  const offX = e.clientX - rect.left, offY = e.clientY - rect.top;
  let moving = false;
  const { cw, ch } = cellSize();

  const onMove = (ev) => {
    if (!moving && Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 5) return;
    moving = true;
    node.classList.add('dragging');
    node.style.left = clamp(ev.clientX - offX, 0, window.innerWidth - cw) + 'px';
    node.style.top = clamp(ev.clientY - offY, 0, window.innerHeight - TASKBAR - ch) + 'px';
  };
  const onUp = (ev) => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    if (!moving) return;
    node.classList.remove('dragging');
    const { cols, rows } = grid();
    let col = clamp(Math.round((ev.clientX - offX - PAD) / cw), 0, cols - 1);
    let row = clamp(Math.round((ev.clientY - offY - PAD) / ch), 0, rows - 1);
    // resolve collisions
    const taken = new Set(state.desktopIcons.filter((o) => o !== ic && o.col != null).map((o) => o.col + ',' + o.row));
    if (taken.has(col + ',' + row)) {
      const spot = freeCell(taken);
      col = spot.col; row = spot.row;
    }
    ic.col = col; ic.row = row;
    node.style.left = (PAD + col * cw) + 'px';
    node.style.top = (PAD + row * ch) + 'px';
    save();
  };
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

/* ------------------------------ marquee + empty space ------------------------------ */
function bindDesktopSurface() {
  const surface = desktopEl();
  let marquee = null;
  let startX = 0, startY = 0;

  surface.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.d-icon')) return;
    blurWindows();
    selectOnly(null);
    const box = document.getElementById('desktop-marquee');
    startX = e.clientX; startY = e.clientY;
    box.style.display = 'block';
    marquee = box;
    const onMove = (ev) => {
      const x = Math.min(startX, ev.clientX), y = Math.min(startY, ev.clientY);
      const w = Math.abs(ev.clientX - startX), h = Math.abs(ev.clientY - startY);
      Object.assign(box.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
      const sel = new Set();
      document.querySelectorAll('.d-icon').forEach((n) => {
        const r = n.getBoundingClientRect();
        if (r.left < x + w && r.right > x && r.top < y + h && r.bottom > y) sel.add(n.dataset.id);
      });
      document.querySelectorAll('.d-icon').forEach((n) => n.classList.toggle('selected', sel.has(n.dataset.id)));
      selected = sel;
    };
    const onUp = () => {
      box.style.display = 'none';
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });

  surface.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.d-icon')) return;
    e.preventDefault();
    showDesktopMenu(e.clientX, e.clientY);
  });
}

function showDesktopMenu(x, y) {
  const sizes = { large: 'Large icons', medium: 'Medium icons', small: 'Small icons' };
  openMenu(x, y, [
    { label: 'View', icon: 'view', submenu: [
      ...Object.entries(sizes).map(([k, label]) => ({
        label, checked: state.settings.iconSize === k,
        action: () => { state.settings.iconSize = k; save(); renderDesktop(); },
      })),
      'sep',
      { label: 'Show desktop icons', checked: state.settings.showDesktopIcons, action: () => {
        state.settings.showDesktopIcons = !state.settings.showDesktopIcons;
        document.getElementById('desktop-icons').style.display = state.settings.showDesktopIcons ? 'block' : 'none';
        save();
      } },
      { label: 'Auto arrange icons', action: () => { autoArrange(); } },
    ] },
    { label: 'Sort by', icon: 'sort', submenu: [
      { label: 'Name', action: () => sortIcons('name') },
      { label: 'Item type', action: () => sortIcons('type') },
      { label: 'Date modified', action: () => sortIcons('date') },
      'sep',
      { label: 'Size', action: () => sortIcons('name') },
    ] },
    { label: 'Refresh', icon: 'refresh', shortcut: 'F5', action: renderDesktop },
    'sep',
    { label: 'New', icon: 'plus', submenu: [
      { label: 'Folder', icon: 'newfolder', action: () => notify({ title: 'Desktop', body: 'New folders are created in File Explorer.', icon: 'newfolder' }) },
      { label: 'Text Document', icon: 'newfile', action: () => openApp('notepad', { newFile: true }) },
      { label: 'Bitmap image', icon: 'paint', action: () => openApp('paint') },
    ] },
    'sep',
    { label: 'Display settings', icon: 'display', action: () => openApp('settings', { page: 'display' }) },
    { label: 'Personalize', icon: 'personalization', action: () => openApp('settings', { page: 'personalization' }) },
    { label: 'Open PowerShell here', icon: 'terminal', action: () => openApp('terminal') },
  ]);
}

function sortIcons(mode) {
  const arr = state.desktopIcons;
  if (mode === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
  if (mode === 'type') arr.sort((a, b) => a.appId.localeCompare(b.appId));
  if (mode === 'date') arr.sort((a, b) => a.id.localeCompare(b.id));
  arr.forEach((ic) => { ic.col = null; ic.row = null; });
  renderDesktop();
}

function autoArrange() {
  state.desktopIcons.forEach((ic) => { ic.col = null; ic.row = null; });
  renderDesktop();
}

export function initDesktop() {
  bindDesktopSurface();
  renderDesktop();
  if (!state.settings.showDesktopIcons) document.getElementById('desktop-icons').style.display = 'none';
  document.getElementById('desktop-icons').style.display = state.settings.showDesktopIcons ? 'block' : 'none';
  bus.on('recycle:changed', renderDesktop);
  window.addEventListener('resize', () => {
    const { cols, rows } = grid();
    let changed = false;
    state.desktopIcons.forEach((ic) => {
      if (ic.col >= cols) { ic.col = cols - 1; changed = true; }
      if (ic.row >= rows) { ic.row = Math.max(0, rows - 1); changed = true; }
    });
    if (changed) save();
    renderDesktop();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F5' && !document.querySelector('.win.active input, .win.active textarea')) {
      e.preventDefault();
      renderDesktop();
    }
    if ((e.key === 'Delete' || e.key === 'Enter') && selected.size && document.activeElement?.classList.contains('d-icon')) {
      const ic = state.desktopIcons.find((i) => i.id === [...selected][0]);
      if (ic && e.key === 'Enter') openItem(ic);
    }
  });
}
