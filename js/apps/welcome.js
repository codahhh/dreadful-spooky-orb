/* ============================================================
   Get started / welcome
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { openApp } from '../launcher.js';
import { state } from '../store.js';

export const meta = { id: 'welcome', name: 'Get started', icon: 'windows' };

const TIPS = [
  { icon: 'windows', title: 'This is a real desktop', text: 'Windows open, drag, snap, stack and close. Every app here actually works.' },
  { icon: 'taskview', title: 'Task View · Win + Tab', text: 'See every open window at once, close them, or jump between them.' },
  { icon: 'folder', title: 'Your files persist', text: 'File Explorer, Notepad and Paint share a real file system stored in your browser.' },
  { icon: 'terminal', title: 'Try the terminal', text: 'PowerShell knows about 30 commands. Start with <b>help</b>.' },
  { icon: 'settings', title: 'Make it yours', text: 'Change the wallpaper, accent colour and dark mode in Settings.' },
  { icon: 'mine', title: 'Have a break', text: 'Minesweeper is installed. The orb insists you play it.' },
];

export function launch() {
  const win = createWindow({
    title: 'Get started', icon: 'windows', width: 880, height: 620,
    minWidth: 520, minHeight: 380, appId: 'welcome', instanceKey: 'welcome',
  });

  win.body.innerHTML = `
    <div class="welcome">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:6px">
        <span style="width:44px;height:44px;display:inline-flex">${icon('windows', 44)}</span>
        <div>
          <h1 style="margin:0">Welcome, ${esc(state.settings.userName || 'Alex')}</h1>
          <div style="font-size:12.5px;color:var(--muted)">Windows 10 Pro · build 19045.3803 · running entirely in your browser</div>
        </div>
      </div>
      <p>Everything on this desktop is functional software: windows snap to the screen edges, the file system survives a reload, and the terminal will happily argue with you. Nothing is sent anywhere.</p>
      <div class="tips">
        ${TIPS.map((t) => `<div class="tip"><b><span style="width:18px;height:18px;display:inline-flex">${icon(t.icon)}</span>${esc(t.title)}</b>${t.text}</div>`).join('')}
      </div>
      <h2 style="font-size:15px;font-weight:600;margin:24px 0 8px">Keyboard shortcuts</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px 18px;font-size:12px;max-width:760px">
        ${[
          ['Win', 'Start menu'], ['Win + D', 'Show desktop'], ['Win + E', 'File Explorer'],
          ['Win + A', 'Action center'], ['Win + I', 'Settings'], ['Win + L', 'Lock the PC'],
          ['Win + Tab', 'Task view'], ['Alt + Tab', 'Switch windows'], ['Alt + F4', 'Close window'],
          ['Win + Arrow', 'Snap window'], ['Ctrl+Shift+Esc', 'Task Manager'], ['F2 / Delete', 'Rename / delete in Explorer'],
        ].map(([k, v]) => `<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-bottom:1px dotted var(--line)"><span class="kbd">${k}</span><span style="color:var(--muted)">${v}</span></div>`).join('')}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:24px">
        <button class="btn primary" data-open="explorer">Open File Explorer</button>
        <button class="btn" data-open="terminal">Open PowerShell</button>
        <button class="btn" data-open="settings">Personalise Windows</button>
        <button class="btn" data-open="minesweeper">Play Minesweeper</button>
      </div>
      <div style="margin-top:22px;font-size:11px;color:var(--muted);max-width:640px;border-top:1px solid var(--line);padding-top:12px">
        Tip: press <span class="kbd">Win</span> (or <span class="kbd">Ctrl</span>+<span class="kbd">Esc</span>) to open Start. Yes, the Start menu has live tiles, an app list and a working power menu.
      </div>
    </div>`;
  win.body.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openApp(b.dataset.open)));
  return win;
}
