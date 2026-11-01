/* ============================================================
   Windows 10 — shell bootstrap
   ============================================================ */

import { applySettings, state } from './store.js';
import { initSession } from './boot.js';
import { initDesktop, renderDesktop } from './desktop.js';
import { initTaskbar } from './taskbar.js';
import { toggleStart, closeStart, isStartOpen } from './startmenu.js';
import { showSearch, toggleSearch, closeSearch, isSearchOpen } from './search.js';
import { toggleAC, closeAC, isACOpen } from './actioncenter.js';
import { toggleCal, closeCal, isCalOpen } from './calendarpopup.js';
import { toggleTaskView, closeTaskView, isTaskViewOpen } from './taskview.js';
import { launchApp } from './apps/registry.js';
import { icon } from './icons.js';
import {
  minimizeAll, restoreAll, visibleWindows, cycleWindows, closeFocused,
  snapFocused, toggleFocusedMax, focusedWindow, allWindows,
} from './wm.js';
import { notify } from './notify.js';
import { bus, showDialog } from './utils.js';
import { closeMenus } from './contextmenu.js';

applySettings();
initDesktop();
initTaskbar();
initSession();

/* ------------------------------ taskbar buttons ------------------------------ */
document.getElementById('start-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  toggleStart();
});
document.getElementById('search-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  toggleSearch();
});
document.getElementById('taskview-btn').addEventListener('click', () => toggleTaskView());
document.getElementById('notif-btn').addEventListener('click', () => toggleAC());
document.getElementById('clock').addEventListener('click', () => toggleCal());

/* ------------------------------ panel exclusivity ------------------------------ */
bus.on('shell:panel', (which) => {
  if (which !== 'start' && isStartOpen()) closeStart();
  if (which !== 'search' && isSearchOpen()) closeSearch();
  if (which !== 'ac' && isACOpen()) closeAC();
  if (which !== 'calendar' && isCalOpen()) closeCal();
  if (which !== 'taskview' && isTaskViewOpen()) closeTaskView();
});

bus.on('desktop:refresh', renderDesktop);

/* ------------------------------ first run ------------------------------ */
bus.on('session:unlocked', () => {
  let seen = null;
  try { seen = localStorage.getItem('win10os.seen'); } catch (_) { seen = '1'; }
  if (!seen) {
    try { localStorage.setItem('win10os.seen', '1'); } catch (_) {}
    setTimeout(() => {
      launchApp('welcome');
      setTimeout(() => notify({
        title: 'Welcome to Windows 10',
        body: 'Press Win (or Ctrl+Esc) for Start. Win+Tab shows every window. Everything is real — go explore.',
        icon: 'windows',
        timeout: 8000,
      }), 900);
    }, 420);
  } else if (!state.settings.startTiles?.length) {
    // nothing broken, just a quiet boot
  }
});

/* ------------------------------ keyboard ------------------------------ */
let metaHeld = false;
let metaUsed = false;

window.addEventListener('keydown', (e) => {
  const active = document.activeElement;
  const typing = !!active && (/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName) || active.isContentEditable);
  const k = e.key.toLowerCase();

  if (e.key === 'Meta') { metaHeld = true; metaUsed = false; }

  // Ctrl+Shift+Esc — Task Manager
  if (e.ctrlKey && e.shiftKey && k === 'escape') {
    e.preventDefault();
    launchApp('taskmanager');
    return;
  }

  // Alt+F4 — close focused window, or offer to shut down from the desktop
  if (e.altKey && e.key === 'F4') {
    e.preventDefault();
    if (focusedWindow()) { closeFocused(); return; }
    showDialog({
      title: 'Shut Down Windows',
      body: `<div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:14px">
        <span style="width:40px;height:40px;flex:0 0 40px">${icon('windows')}</span>
        <div><b>What do you want the computer to do?</b><div style="color:var(--muted);font-size:11.5px;margin-top:4px">This PC will politely pretend to do it.</div></div>
      </div>
      <select id="sd-choice" style="width:100%;height:30px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:0 8px">
        <option value="shutdown">Shut down</option>
        <option value="restart">Restart</option>
        <option value="sleep">Sleep</option>
        <option value="signout">Sign out</option>
      </select>`,
      buttons: [{ id: 'cancel', label: 'Cancel' }, { id: 'ok', label: 'OK', primary: true }],
      width: 420,
    }).then((r) => {
      if (r !== 'ok') return;
      const v = document.getElementById('sd-choice')?.value || 'shutdown';
      if (v === 'signout') bus.emit('session:signout');
      else if (v === 'sleep') bus.emit('session:sleep');
      else bus.emit('power:action', v);
    });
    return;
  }

  // Alt+Tab — cycle windows
  if (e.altKey && e.key === 'Tab') {
    e.preventDefault();
    cycleWindows(e.shiftKey ? -1 : 1);
    return;
  }

  // Ctrl+Esc — Start (stand-in for the Win key)
  if (e.ctrlKey && e.key === 'Escape') {
    e.preventDefault();
    toggleStart();
    return;
  }

  if (e.key === 'Escape') {
    if (document.querySelector('.dialog-backdrop')) return; // dialogs handle their own Esc
    if (isStartOpen()) closeStart();
    if (isSearchOpen()) closeSearch();
    if (isACOpen()) closeAC();
    if (isCalOpen()) closeCal();
    if (isTaskViewOpen()) closeTaskView();
    closeMenus();
    return;
  }

  if (!e.metaKey) return;
  metaUsed = true;

  const win = focusedWindow();
  switch (k) {
    case 'e': e.preventDefault(); launchApp('explorer'); break;
    case 'd': e.preventDefault(); visibleWindows().length ? minimizeAll() : restoreAll(); break;
    case 'l': e.preventDefault(); closeStart(); bus.emit('session:lock'); break;
    case 'a': e.preventDefault(); toggleAC(); break;
    case 'i': e.preventDefault(); launchApp('settings'); break;
    case 's': e.preventDefault(); showSearch(); break;
    case 'tab': e.preventDefault(); toggleTaskView(); break;
    case 'arrowleft': e.preventDefault(); snapFocused('left'); break;
    case 'arrowright': e.preventDefault(); snapFocused('right'); break;
    case 'arrowup': e.preventDefault(); if (win && !win.maximized) toggleFocusedMax(); else if (win) snapFocused('max'); break;
    case 'arrowdown': e.preventDefault(); if (win?.maximized) toggleFocusedMax(); else win?.minimize(); break;
    default: metaUsed = false; break;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'Meta') {
    if (metaHeld && !metaUsed && !typingTarget()) toggleStart();
    metaHeld = false;
    metaUsed = false;
  }
});

function typingTarget() {
  const a = document.activeElement;
  return !!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable);
}

// Prevent the browser's own context menu except inside text inputs
window.addEventListener('contextmenu', (e) => {
  const t = e.target instanceof Element ? e.target : null;
  const inField = t && t.closest('input, textarea, [contenteditable="true"]');
  if (!inField) e.preventDefault();
});

/* ---------- touch: long press fires a context menu (iOS has no native one) ---------- */
let lpTimer = null;
let lpFired = false;
let lpOrigin = { x: 0, y: 0 };

function cancelLongPress() {
  if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
}

window.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse') return;
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return;
  lpFired = false;
  lpOrigin = { x: e.clientX, y: e.clientY };
  cancelLongPress();
  lpTimer = setTimeout(() => {
    lpTimer = null;
    lpFired = true;
    target.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true, composed: true,
      clientX: lpOrigin.x, clientY: lpOrigin.y, button: 2,
    }));
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (_) {} }
  }, 480);
}, true);

window.addEventListener('pointermove', (e) => {
  if (!lpTimer) return;
  if (Math.hypot(e.clientX - lpOrigin.x, e.clientY - lpOrigin.y) > 12) cancelLongPress();
}, true);
window.addEventListener('pointerup', cancelLongPress, true);
window.addEventListener('pointercancel', cancelLongPress, true);
window.addEventListener('scroll', cancelLongPress, true);

// swallow the click that a long press would otherwise turn into a tap
window.addEventListener('click', (e) => {
  if (!lpFired) return;
  lpFired = false;
  e.stopPropagation();
  e.preventDefault();
}, true);

// Focus the desktop when clicking empty space so shortcuts keep working
document.getElementById('desktop').addEventListener('pointerdown', (e) => {
  if (e.target.id === 'desktop' || e.target.id === 'desktop-icons' || e.target.id === 'desktop-marquee') {
    e.currentTarget.focus({ preventScroll: true });
  }
});

// keep the wall clock honest after sleep / tab switch
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) window.dispatchEvent(new Event('resize'));
});

console.info('%cWindows 10 (browser build)', 'font:600 14px "Segoe UI";color:#0078d7', '\nType Ctrl+Shift+Esc, or press Win+E. Enjoy.');

/* debug / automation hook (harmless in production) */
window.__WIN10 = { launchApp, state, bus, minimizeAll, restoreAll };
