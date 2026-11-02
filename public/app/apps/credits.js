/* ============================================================
   Credits — who built this thing, and out of what
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { state } from '../store.js';
import { notify } from '../notify.js';
import { openApp } from '../launcher.js';
import { allApps } from './registry.js';

export const meta = { id: 'credits', name: 'Credits', icon: 'star' };

const SECTIONS = [
  {
    role: 'Directed by',
    people: [['You', 'the person clicking']],
  },
  {
    role: 'Built by',
    people: [
      ['Arena.ai — Agent Mode', 'every line of HTML, CSS and JavaScript'],
      ['', 'across a surprising number of very long turns'],
    ],
  },
  {
    role: 'Commissioned by',
    people: [['Scope Develop', '“Create a FULL os like windows 10”']],
  },
  {
    role: 'Shell & window manager',
    people: [
      ['wm.js', 'drag, resize, snap, maximize, minimize, one delegated handler for all three buttons'],
      ['desktop.js', 'icons, selection, marquee, context menus'],
      ['taskbar.js', 'pinned apps, thumbnails, tray, clock'],
    ],
  },
  {
    role: 'Apps',
    people: [
      ['18 applications', 'Explorer, Notepad, Calculator, Paint, Settings, Edge, Terminal, Task Manager, Photos, Minesweeper, Store, Groove Music, Recycle Bin, Mail, Weather, Calendar, Get started, Credits'],
    ],
  },
  {
    role: 'Design language',
    people: [
      ['Fluent', 'acrylic panels, mica-ish surfaces, accent colour, light and dark'],
      ['Segoe UI', 'with system fallbacks for the devices that never had it'],
      ['60+ icons', 'hand-authored inline SVG, no icon fonts, no sprite sheets'],
    ],
  },
  {
    role: 'The Orb',
    people: [
      ['Uncredited', 'load-bearing'],
      ['', 'humming softly at 60 Hz since the first commit'],
    ],
  },
  {
    role: 'Quality assurance',
    people: [
      ['jsdom 30', 'headless click-through of every app, at 1280 px and 390 px'],
      ['You', 'who found the buttons that did not work'],
    ],
  },
  {
    role: 'Technology',
    people: [
      ['HTML + CSS + ES modules', 'no framework, no bundler, no build step'],
      ['localStorage', 'settings, files, wallpaper, installed apps'],
      ['Inline SVG', 'every wallpaper and artwork is drawn in code'],
      ['Zero network calls', 'nothing leaves the tab'],
    ],
  },
  {
    role: 'Deployment',
    people: [
      ['Vercel', 'static hosting, windows10-in-browser.vercel.app'],
      ['GitHub', 'scope-develop — the repository behind it all'],
    ],
  },
  {
    role: 'Special thanks',
    people: [
      ['The taskbar alignment debate', 'still unresolved, still load-bearing'],
      ['Ctrl + Shift + Esc', 'the shortcut everyone presses just to feel something'],
      ['Minesweeper', 'for teaching patience to an entire generation'],
    ],
  },
  {
    role: 'Legal',
    people: [
      ['Not affiliated with Microsoft', 'Windows is a trademark of Microsoft Corporation. This is a fan-made tribute, built from scratch.'],
      ['No real files were harmed', 'the whole file system lives in your browser and disappears when you clear it'],
    ],
  },
];

const STATS = () => [
  ['Apps installed', String(allApps().length)],
  ['Window manager', 'snap · resize · maximize'],
  ['Runtime dependencies', '0'],
  ['Network calls', '0'],
  ['Build', '19045.3803 · web'],
];

const CREDITS_TEXT = () => [
  'WINDOWS BROWSER — CREDITS',
  'Windows 10, rebuilt in the browser',
  '',
  ...SECTIONS.flatMap((s) => [s.role.toUpperCase(), ...s.people.filter(([n]) => n).map(([n, d]) => `  ${n}${d ? ' — ' + d : ''}`), '']),
  'Not affiliated with Microsoft. Windows is a trademark of Microsoft Corporation.',
].join('\n');

export function launch() {
  const win = createWindow({
    title: 'Credits',
    icon: 'star',
    width: 760,
    height: 660,
    minWidth: 380,
    minHeight: 320,
    appId: 'credits',
    instanceKey: 'credits',
  });

  let rolling = false;
  let raf = null;
  let speed = 0;

  win.body.innerHTML = `
    <div class="credits" style="display:flex;flex-direction:column;height:100%;background:#0b0d12;color:#e9ecf2">
      <div style="position:relative;padding:26px 28px 20px;background:
          radial-gradient(120% 140% at 12% 0%, rgba(123,71,255,.35), transparent 60%),
          radial-gradient(90% 120% at 100% 0%, rgba(18,247,214,.18), transparent 55%),
          linear-gradient(160deg,#12141c,#0b0d12);border-bottom:1px solid rgba(255,255,255,.08);overflow:hidden">
        <div style="position:absolute;right:-40px;top:-60px;width:220px;height:220px;border-radius:50%;
            background:radial-gradient(circle at 35% 30%, #8f6bff, #3b1e7a 55%, transparent 72%);opacity:.55;filter:blur(2px)"></div>
        <div style="display:flex;align-items:center;gap:14px;position:relative">
          <span style="width:46px;height:46px;display:inline-flex">${icon('windows', 46)}</span>
          <div>
            <div style="font-size:22px;font-weight:600;letter-spacing:-.2px">Windows Browser</div>
            <div style="font-size:12px;color:#a9b0c0;margin-top:2px">Windows 10, rebuilt in the browser — credits</div>
          </div>
          <span style="margin-left:auto;font-size:11px;color:#8d94a6;text-align:right">build 19045.3803<br>zero dependencies</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap;position:relative">
          <button class="btn primary" id="cr-roll" style="height:30px;padding:0 14px">${icon('play')} Play credits</button>
          <button class="btn" id="cr-copy" style="height:30px;padding:0 14px">${icon('copy')} Copy credits</button>
          <button class="btn" id="cr-welcome" style="height:30px;padding:0 14px">${icon('windows')} Get started</button>
          <button class="btn" id="cr-settings" style="height:30px;padding:0 14px">${icon('settings')} Settings</button>
        </div>
        <div style="display:flex;gap:18px;margin-top:16px;flex-wrap:wrap;position:relative">
          ${STATS().map(([k, v]) => `<div style="font-size:11px;color:#8d94a6"><div style="color:#e9ecf2;font-size:13px;font-weight:600">${esc(v)}</div>${esc(k)}</div>`).join('')}
        </div>
      </div>

      <div id="cr-scroll" style="flex:1;overflow:auto;padding:22px 28px 40px;scroll-behavior:smooth">
        ${SECTIONS.map((s) => `
          <div style="margin-bottom:26px">
            <div style="font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:#7b47ff;font-weight:700;margin-bottom:8px">${esc(s.role)}</div>
            ${s.people.map(([name, detail]) => `
              <div style="display:flex;gap:12px;align-items:baseline;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.055)">
                <span style="font-size:13.5px;font-weight:${name ? 600 : 400};color:${name ? '#f3f5fa' : '#a9b0c0'};min-width:200px">${esc(name || '·')}</span>
                <span style="font-size:12px;color:#a9b0c0;flex:1">${esc(detail)}</span>
              </div>`).join('')}
          </div>`).join('')}

        <div style="margin-top:8px;padding:18px;border:1px solid rgba(255,255,255,.08);border-radius:6px;background:rgba(255,255,255,.03)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <span style="width:22px;height:22px;display:inline-flex">${icon('star')}</span>
            <b style="font-size:13px">Thank you for clicking through</b>
          </div>
          <div style="font-size:12px;color:#a9b0c0;line-height:1.6">
            This desktop is ${allApps().length} working applications sharing one in-memory file system, one window manager
            and one very patient browser tab. Nothing here talks to a server: every icon, wallpaper and font fallback
            ships with the page.
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            ${['explorer', 'terminal', 'minesweeper', 'weather', 'mail'].map((id) => {
              const m = allApps().find((a) => a.id === id);
              return m ? `<button class="btn" data-open="${id}" style="height:28px;padding:0 12px;display:inline-flex;gap:7px;align-items:center">
                <span style="width:15px;height:15px;display:inline-flex">${icon(m.icon)}</span>${esc(m.name)}</button>` : '';
            }).join('')}
          </div>
        </div>

        <div style="text-align:center;color:#6c7385;font-size:11px;margin-top:26px;line-height:1.7">
          <div style="width:60px;height:60px;margin:0 auto 10px;opacity:.55">${icon('windows', 60)}</div>
          Windows Browser · ${esc(state.settings.userName || 'Alex')}’s PC<br>
          Not affiliated with Microsoft. Windows is a trademark of Microsoft Corporation.
        </div>
      </div>
    </div>`;

  const scroller = win.body.querySelector('#cr-scroll');
  const rollBtn = win.body.querySelector('#cr-roll');

  function stopRoll() {
    rolling = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    rollBtn.innerHTML = `${icon('play')} Play credits`;
  }

  function startRoll() {
    if (rolling) { stopRoll(); return; }
    rolling = true;
    speed = 0;
    rollBtn.innerHTML = `${icon('pause')} Stop credits`;
    scroller.scrollTop = 0;
    let last = performance.now();
    const tick = (now) => {
      if (!rolling) return;
      const dt = Math.min(64, now - last);
      last = now;
      speed = Math.min(2.4, speed + dt * 0.0022);   // gentle ramp up
      scroller.scrollTop += speed * (dt / 16);
      const atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
      if (atEnd) { stopRoll(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  rollBtn.addEventListener('click', startRoll);
  scroller.addEventListener('wheel', stopRoll, { passive: true });
  scroller.addEventListener('touchstart', stopRoll, { passive: true });
  scroller.addEventListener('pointerdown', (e) => { if (e.target !== rollBtn) stopRoll(); });
  win.onBeforeClose = () => { stopRoll(); return true; };

  win.body.querySelector('#cr-copy').addEventListener('click', async () => {
    const text = CREDITS_TEXT();
    try {
      await navigator.clipboard.writeText(text);
      notify({ title: 'Credits', body: 'The full credits are on your clipboard.', icon: 'star', timeout: 3000 });
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.append(ta); ta.select();
      try { document.execCommand('copy'); } catch (__) {}
      ta.remove();
      notify({ title: 'Credits', body: 'Credits copied.', icon: 'star', timeout: 3000 });
    }
  });

  win.body.querySelector('#cr-welcome').addEventListener('click', () => openApp('welcome'));
  win.body.querySelector('#cr-settings').addEventListener('click', () => openApp('settings'));
  win.body.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openApp(b.dataset.open)));

  return win;
}
