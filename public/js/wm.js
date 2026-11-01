/* ============================================================
   Window manager: create, drag, resize, snap, minimize, close
   ============================================================ */

import { icon } from './icons.js';
import { bus, clamp, uid, esc } from './utils.js';

const layer = () => document.getElementById('windows');
const snapPreview = () => document.getElementById('snap-preview');

const wins = [];
let zTop = 100;
let focusSuppressed = false;
const TASKBAR = 40;
const GEOMETRY = {};

function screenSize() {
  return { vw: window.innerWidth, vh: window.innerHeight - TASKBAR };
}

function setRect(win, x, y, w, h) {
  const { vw, vh } = screenSize();
  w = Math.min(w, vw);
  h = Math.min(h, vh);
  x = clamp(x, -w + 120, vw - 120);
  y = clamp(y, 0, vh - 36);
  win.x = Math.round(x); win.y = Math.round(y); win.w = Math.round(w); win.h = Math.round(h);
  win.el.style.left = win.x + 'px';
  win.el.style.top = win.y + 'px';
  win.el.style.width = win.w + 'px';
  win.el.style.height = win.h + 'px';
}

function bringToFront(win) {
  focusSuppressed = false;
  zTop += 1;
  // keep windows strictly below the taskbar / flyouts
  if (zTop > 430) {
    const ordered = [...wins].sort((a, b) => (+a.el.style.zIndex || 0) - (+b.el.style.zIndex || 0));
    zTop = 110;
    ordered.forEach((w) => { w.el.style.zIndex = zTop++; });
  }
  win.el.style.zIndex = zTop;
  for (const w of wins) w.el.classList.toggle('active', w === win);
  for (const w of wins) w.el.classList.toggle('inactive', w !== win);
  win.el.classList.remove('inactive');
}

function emit() { bus.emit('win:changed'); }

export function createWindow(opts = {}) {
  const {
    title = 'Window', icon: ic = 'file', width = 900, height = 600,
    x, y, appId = 'app', resizable = true, maximizable = true, minimizable = true,
    minWidth = 320, minHeight = 180, onClose = null, onResize = null, bodyClass = '', instanceKey = null,
  } = opts;

  // reuse an existing instance if requested
  if (instanceKey) {
    const existing = wins.find((w) => w.instanceKey === instanceKey && !w.closed);
    if (existing) { existing.restore(); existing.focus(); return existing; }
  }

  const { vw, vh } = screenSize();
  const w = Math.min(width, vw - 24);
  const h = Math.min(height, vh - 24);
  let px = x != null ? x : Math.round((vw - w) / 2) + ((wins.length % 6) - 2) * 26;
  let py = y != null ? y : Math.round((vh - h) / 2.4) + (wins.length % 6) * 20;
  px = clamp(px, 0, vw - w);
  py = clamp(py, 0, vh - h);

  const el = document.createElement('div');
  el.className = 'win';
  el.dataset.app = appId;
  el.innerHTML = `
    <div class="win-titlebar">
      <div class="win-title"><span class="w-ico">${icon(ic)}</span><span class="w-text">${esc(title)}</span></div>
      <div class="win-controls">
        ${minimizable ? `<button class="win-btn min" title="Minimize"><svg viewBox="0 0 10 10"><path d="M0 5h10" stroke="currentColor" stroke-width="1"/></svg></button>` : ''}
        ${maximizable ? `<button class="win-btn max" title="Maximize"><svg viewBox="0 0 10 10" class="i-max"><rect x=".5" y=".5" width="9" height="9" fill="none" stroke="currentColor"/></svg><svg viewBox="0 0 10 10" class="i-restore" style="display:none"><rect x=".5" y="2.5" width="7" height="7" fill="none" stroke="currentColor"/><path d="M2.5 2.5V.5h7v7h-2" fill="none" stroke="currentColor"/></svg></button>` : ''}
        <button class="win-btn close" title="Close"><svg viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" stroke-width="1"/></svg></button>
      </div>
    </div>
    <div class="win-body ${bodyClass}"></div>
    ${resizable ? ['n','s','e','w','ne','nw','se','sw'].map((d) => `<div class="resize-handle rh-${d}" data-dir="${d}"></div>`).join('') : ''}
  `;
  layer().append(el);

  const win = {
    id: uid('win'),
    appId, instanceKey, opts,
    el,
    titlebar: el.querySelector('.win-titlebar'),
    titleEl: el.querySelector('.w-text'),
    iconEl: el.querySelector('.w-ico'),
    body: el.querySelector('.win-body'),
    x: px, y: py, w, h,
    minimized: false, maximized: false, snap: null, closed: false,
    title, icon: ic,
    prevRect: null,
    focus() { if (this.minimized) this.restore(); bringToFront(this); emit(); },
    setTitle(t) {
      this.title = t;
      this.titleEl.textContent = t;
      emit();
    },
    setIcon(name) { this.iconEl.innerHTML = icon(name); this.icon = name; emit(); },
    setRect: (x2, y2, w2, h2) => setRect(win, x2, y2, w2, h2),
    minimize() {
      if (this.minimized || !minimizable) return;
      this.minimized = true;
      this.el.classList.add('minimizing');
      setTimeout(() => {
        this.el.classList.remove('minimizing');
        if (this.minimized) this.el.style.display = 'none';
      }, 170);
      emit();
    },
    restore() {
      if (!this.minimized) return;
      this.minimized = false;
      this.el.style.display = 'flex';
      this.el.style.opacity = '';
      this.el.classList.add('restoring');
      setTimeout(() => this.el.classList.remove('restoring'), 190);
      emit();
    },
    toggleMaximize() { toggleMaximize(this); },
    close() { closeWindow(win); },
  };

  wins.push(win);
  setRect(win, px, py, w, h);
  // phones: apps get the whole work area, otherwise their toolbars are clipped
  if (typeof window !== 'undefined' && window.innerWidth <= 760) setTimeout(() => { if (!win.closed) maximize(win); }, 0);

  // ---------- controls ----------
  el.querySelector('.min')?.addEventListener('click', (e) => { e.stopPropagation(); win.minimize(); });
  el.querySelector('.max')?.addEventListener('click', (e) => { e.stopPropagation(); toggleMaximize(win); });
  el.querySelector('.close')?.addEventListener('click', (e) => { e.stopPropagation(); win.close(); });

  win.titlebar.addEventListener('dblclick', (e) => {
    if (e.target.closest('.win-btn')) return;
    if (maximizable) toggleMaximize(win);
  });

  // ---------- drag ----------
  win.titlebar.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('.win-btn')) return;
    startDrag(win, e);
  });

  // ---------- resize ----------
  el.querySelectorAll('.resize-handle').forEach((h) => {
    h.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      startResize(win, e, h.dataset.dir);
    });
  });

  el.addEventListener('pointerdown', (e) => {
    if (win.minimized) return;
    bringToFront(win);
    emit();
  }, true);

  bringToFront(win);
  bus.emit('win:opened', win);
  emit();
  return win;
}

/* ------------------------------ state changes ------------------------------ */
function toggleMaximize(win) {
  if (win.maximized) restoreFromMax(win);
  else maximize(win);
}

function maximize(win) {
  if (win.maximized) return;
  win.prevRect = { x: win.x, y: win.y, w: win.w, h: win.h };
  win.maximized = true;
  win.snap = null;
  win.el.classList.add('maximized');
  win.el.classList.remove('snapped');
  const btn = win.el.querySelector('.i-max'), btn2 = win.el.querySelector('.i-restore');
  if (btn) btn.style.display = 'none';
  if (btn2) btn2.style.display = 'block';
  const mx = win.el.querySelector('.max');
  if (mx) mx.title = 'Restore Down';
  emit();
  win.opts.onResize?.();
}

function restoreFromMax(win) {
  if (!win.maximized) return;
  win.maximized = false;
  win.el.classList.remove('maximized');
  const r = win.prevRect || { x: 80, y: 60, w: 900, h: 600 };
  setRect(win, r.x, r.y, r.w, r.h);
  const btn = win.el.querySelector('.i-max'), btn2 = win.el.querySelector('.i-restore');
  if (btn) btn.style.display = 'block';
  if (btn2) btn2.style.display = 'none';
  const mx = win.el.querySelector('.max');
  if (mx) mx.title = 'Maximize';
  emit();
  win.opts.onResize?.();
}

function closeWindow(win) {
  if (win.closed) return;
  if (typeof win.onBeforeClose === 'function' && win.onBeforeClose() === false) return;
  win.closed = true;
  win.el.classList.add('closing');
  setTimeout(() => win.el.remove(), 130);
  const i = wins.indexOf(win);
  if (i >= 0) wins.splice(i, 1);
  win.opts.onClose?.();
  bus.emit('win:closed', win);
  emit();
}

/* ------------------------------ dragging ------------------------------ */
function startDrag(win, e) {
  const { vw, vh } = screenSize();
  let startX = e.clientX, startY = e.clientY;
  let started = false;
  let snapZone = null;

  if (win.maximized) {
    const ratio = clamp((e.clientX - win.x) / win.w, 0.08, 0.92);
    const prev = win.prevRect || { w: 900, h: 600 };
    restoreFromMax(win);
    win.w = Math.min(prev.w, vw - 24);
    win.h = Math.min(prev.h, vh - 24);
    win.x = clamp(e.clientX - win.w * ratio, 0, vw - win.w);
    win.y = 6;
    setRect(win, win.x, win.y, win.w, win.h);
    startX = e.clientX; startY = e.clientY;
  }
  const offsetX = startX - win.x;
  const offsetY = startY - win.y;
  const startRect = { x: win.x, y: win.y, w: win.w, h: win.h };
  const cls = document.body.classList;
  cls.add('dragging-window');

  const onMove = (ev) => {
    const dx = ev.clientX - startX, dy = ev.clientY - startY;
    if (!started && Math.abs(dx) + Math.abs(dy) > 2) started = true;
    if (!started) return;
    win.snap = null;
    win.el.classList.remove('snapped');
    const nx = ev.clientX - offsetX;
    const ny = Math.max(-2, ev.clientY - offsetY);
    setRect(win, nx, ny, startRect.w, startRect.h);

    // edge detection
    const zone = zoneAt(ev.clientX, ev.clientY);
    if (zone !== snapZone) { snapZone = zone; showPreview(zone); }
  };

  const onUp = () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    cls.remove('dragging-window');
    hidePreview();
    if (started && snapZone) snapTo(win, snapZone);
    else if (!started) {
      // no-op
    }
    emit();
  };
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

function zoneAt(x, y) {
  const { vw, vh } = screenSize();
  const nearL = x <= 6, nearR = x >= vw - 6, nearT = y <= 6;
  if (nearT && nearL) return 'tl';
  if (nearT && nearR) return 'tr';
  if (nearT) return 'max';
  if (nearL) return y > vh * 0.62 ? 'bl' : 'left';
  if (nearR) return y > vh * 0.62 ? 'br' : 'right';
  return null;
}

function zoneRect(zone) {
  const { vw, vh } = screenSize();
  const hw = Math.round(vw / 2), hh = Math.round(vh / 2);
  switch (zone) {
    case 'left': return { x: 0, y: 0, w: hw, h: vh };
    case 'right': return { x: vw - hw, y: 0, w: hw, h: vh };
    case 'max': return { x: 0, y: 0, w: vw, h: vh };
    case 'tl': return { x: 0, y: 0, w: hw, h: hh };
    case 'tr': return { x: vw - hw, y: 0, w: hw, h: hh };
    case 'bl': return { x: 0, y: vh - hh, w: hw, h: hh };
    case 'br': return { x: vw - hw, y: vh - hh, w: hw, h: hh };
    default: return null;
  }
}

function showPreview(zone) {
  const p = snapPreview();
  if (!zone || zone === 'max') { p.hidden = true; return; }
  const r = zoneRect(zone);
  p.hidden = false;
  Object.assign(p.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
}

function hidePreview() { snapPreview().hidden = true; }

function snapTo(win, zone, silent = false) {
  if (zone === 'max') { maximize(win); return; }
  const r = zoneRect(zone);
  if (!r) return;
  if (win.maximized) { win.maximized = false; win.el.classList.remove('maximized'); }
  win.snap = zone;
  win.el.classList.add('snapped');
  setRect(win, r.x, r.y, r.w, r.h);
  const opposite = { left: 'right', right: 'left', tl: 'tr', tr: 'tl', bl: 'br', br: 'bl' }[zone];
  emit();
  if (!silent && (zone === 'left' || zone === 'right')) showSnapAssist(opposite, win);
}

/* ------------------------------ snap assist ------------------------------ */
function showSnapAssist(zone, excluded) {
  const others = wins.filter((w) => w !== excluded && !w.minimized && !w.closed);
  if (others.length < 1) return;
  const assist = document.getElementById('snap-assist');
  assist.hidden = false;
  assist.innerHTML = '';
  assist.style.padding = '0';
  assist.style.background = 'transparent';
  assist.style.backdropFilter = 'none';

  const r = zoneRect(zone);
  const panel = document.createElement('div');
  Object.assign(panel.style, {
    position: 'absolute', left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px',
    padding: '22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))',
    gap: '12px', alignContent: 'start', overflow: 'auto', border: '1px solid rgba(255,255,255,.3)',
  });
  const title = document.createElement('div');
  title.textContent = 'Choose an app to fill this space';
  title.style.cssText = 'grid-column:1/-1;color:#fff;font-size:12px;opacity:.85;margin-bottom:2px;text-shadow:0 1px 3px rgba(0,0,0,.6)';
  panel.append(title);
  others.forEach((w) => {
    const card = document.createElement('button');
    card.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start;gap:8px;background:rgba(40,40,40,.75);border:1px solid rgba(255,255,255,.18);border-radius:4px;padding:12px;color:#fff;text-align:left;backdrop-filter:blur(10px)';
    card.innerHTML = `<span style="display:flex;width:100%;height:76px;align-items:center;justify-content:center;background:rgba(255,255,255,.06);border-radius:3px">${icon(w.icon)}</span>
      <span style="font-size:12px;display:flex;gap:7px;align-items:center"><span style="width:16px;height:16px;display:inline-flex">${icon(w.icon)}</span>${esc(w.title)}</span>`;
    card.querySelectorAll('svg').forEach((s, i) => { s.style.width = s.style.height = i ? '16px' : '34px'; });
    card.addEventListener('click', () => {
      assist.hidden = true;
      snapTo(w, zone, true);
      w.focus();
    });
    panel.append(card);
  });
  const cancel = document.createElement('div');
  cancel.style.cssText = 'position:absolute;inset:0';
  cancel.addEventListener('click', (e) => { if (e.target === cancel) { assist.hidden = true; panel.remove(); cancel.remove(); } });
  assist.append(panel);
  setTimeout(() => document.addEventListener('pointerdown', function once(ev) {
    if (!assist.contains(ev.target)) { assist.hidden = true; document.removeEventListener('pointerdown', once); }
  }), 50);
}

/* ------------------------------ resizing ------------------------------ */
function startResize(win, e, dir) {
  e.preventDefault();
  e.stopPropagation();
  const start = { x: e.clientX, y: e.clientY, w: win.w, h: win.h, l: win.x, t: win.y };
  const minW = win.opts.minWidth || 320, minH = win.opts.minHeight || 180;
  const { vw, vh } = screenSize();

  const onMove = (ev) => {
    const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
    let { l, t, w, h } = start;
    if (dir.includes('e')) w = clamp(start.w + dx, minW, vw - l);
    if (dir.includes('s')) h = clamp(start.h + dy, minH, vh - t);
    if (dir.includes('w')) {
      w = clamp(start.w - dx, minW, start.l + start.w);
      l = start.l + start.w - w;
    }
    if (dir.includes('n')) {
      h = clamp(start.h - dy, minH, start.t + start.h);
      t = start.t + start.h - h;
    }
    setRect(win, l, Math.max(0, t), w, h);
    win.opts.onResize?.();
  };
  const onUp = () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    win.opts.onResize?.();
    emit();
  };
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

/* ------------------------------ queries ------------------------------ */
export function allWindows() { return [...wins].sort((a, b) => (+a.el.style.zIndex || 0) - (+b.el.style.zIndex || 0)); }
export function visibleWindows() { return allWindows().filter((w) => !w.minimized && !w.closed); }
export function focusedWindow() {
  if (focusSuppressed) return null;
  const v = visibleWindows();
  return v[v.length - 1] || null;
}

export function blurWindows() {
  focusSuppressed = true;
  wins.forEach((w) => { w.el.classList.remove('active'); w.el.classList.add('inactive'); });
  emit();
}
export function getWindow(appId) { return wins.find((w) => w.appId === appId && !w.closed); }

export function cycleWindows(dir = 1) {
  const v = allWindows().filter((w) => !w.closed);
  if (!v.length) return;
  const cur = focusedWindow();
  let idx = cur ? v.indexOf(cur) : -1;
  idx = (idx + dir + v.length) % v.length;
  const next = v[idx];
  next.restore();
  next.focus();
}

export function minimizeAll() {
  const v = visibleWindows();
  v.forEach((w) => w.minimize());
  return v.length > 0;
}

export function restoreAll() {
  allWindows().forEach((w) => { if (w.minimized) w.restore(); });
}

export function closeFocused() {
  const w = focusedWindow();
  if (w) w.close();
}

export function snapFocused(zone) {
  const w = focusedWindow();
  if (!w) return;
  if (w.maximized && zone !== 'max') {
    restoreFromMax(w);
    if (zone === 'max') return;
  }
  snapTo(w, zone, true);
}

export function toggleFocusedMax() {
  const w = focusedWindow();
  if (w) toggleMaximize(w);
}

/* keep snapped windows in geometry when the viewport changes */
window.addEventListener('resize', () => {
  const { vw, vh } = screenSize();
  wins.forEach((w) => {
    if (w.closed) return;
    if (w.snap) {
      const r = zoneRect(w.snap);
      if (r) setRect(w, r.x, r.y, r.w, r.h);
    } else if (!w.maximized) {
      if (w.x > vw - 100) setRect(w, vw - w.w - 20, w.y, w.w, w.h);
      if (w.y > vh - 40) setRect(w, w.x, vh - w.h - 40, w.w, w.h);
    }
  });
});
