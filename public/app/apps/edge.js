/* ============================================================
   Microsoft Edge — with a small internal web
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc, bus } from '../utils.js';
import { notify } from '../notify.js';
import { openApp } from '../launcher.js';

export const meta = { id: 'edge', name: 'Microsoft Edge', icon: 'edge' };

const ARTICLES = {
  'windows-10': {
    title: 'Windows 10 — Wikipedia',
    h1: 'Windows 10',
    body: `<p class="edge-p"><b>Windows 10</b> is a major release of the Windows NT operating system developed by Microsoft. Released on 29 July 2015, it introduced the Start menu's return, virtual desktops, the Action Center, Continuum, and a unified app platform.</p>
    <p class="edge-p">Windows 10 was described by Microsoft as "the last version of Windows", a claim later quietly retired when Windows 11 shipped in 2021. It remains one of the most widely installed desktop operating systems.</p>
    <h2 class="edge-h2">Key features</h2>
    <ul style="font-size:13.5px;line-height:1.8;color:#333;padding-left:18px">
      <li>The return of the Start menu, with live tiles</li>
      <li>A unified taskbar with Cortana search and Task View</li>
      <li>Snap Assist and window snapping to halves and quarters</li>
      <li>The Action Center for notifications and quick actions</li>
      <li>Universal Windows Platform apps from the Microsoft Store</li>
    </ul>
    <div class="edge-hero"><div class="big">🪟</div><div><b>The shell you are using right now</b><div class="edge-p" style="margin:4px 0 0">Every pixel of this desktop is HTML, CSS and JavaScript. No virtualisation, no remote desktop — just one page pretending to be an operating system.</div></div></div>
    <h2 class="edge-h2">Support ended</h2>
    <p class="edge-p">Mainstream support for Windows 10 ended on 14 October 2025. This page, however, will keep running as long as your browser does.</p>`,
  },
  'spooky-orb': {
    title: 'The Dreadful Spooky Orb — Field Notes',
    h1: 'The Dreadful Spooky Orb',
    body: `<p class="edge-p">The <b>Dreadful Spooky Orb</b> is an unexplained luminous sphere that appears in the corners of old desktop wallpapers. Witnesses describe a soft violet glow, a faint hum in the key of B minor, and the irresistible urge to rearrange their taskbar.</p>
    <h2 class="edge-h2">Reported behaviour</h2>
    <ul style="font-size:13.5px;line-height:1.8;color:#333;padding-left:18px">
      <li>Appears when you hover the Show Desktop strip</li>
      <li>Moves your desktop icons exactly one grid cell to the left</li>
      <li>Occasionally opens Minesweeper unprompted</li>
    </ul>
    <div class="edge-hero"><div class="big">🔮</div><div><b>Do not taunt the orb</b><div class="edge-p" style="margin:4px 0 0">It is, at worst, mildly dreadful.</div></div></div>
    <p class="edge-p">If you encounter the orb, stay calm, finish your save, and click the desktop exactly once.</p>`,
  },
  'minesweeper': {
    title: 'How to actually win at Minesweeper',
    h1: 'Minesweeper: a field guide',
    body: `<p class="edge-p">Minesweeper is a game of deduction and, occasionally, of terrible luck. The rules are simple: every number counts the mines in the eight surrounding cells. Everything else is logic.</p>
    <h2 class="edge-h2">The 1-2-1 pattern</h2>
    <p class="edge-p">Along a wall, a sequence of <b>1 2 1</b> always means the mines are under the outer two numbers, and the middle cell is safe. Learn it; it will save your life.</p>
    <h2 class="edge-h2">The 1-2-2-1 pattern</h2>
    <p class="edge-p">Similarly, <b>1 2 2 1</b> hides mines beneath both 2s. Clear the 1s.</p>
    <h2 class="edge-h2">The first click</h2>
    <p class="edge-p">This build guarantees your first click is never a mine, which is more than can be said for some versions.</p>
    <div class="edge-hero"><div class="big">💣</div><div><b>Try it now</b><div class="edge-p" style="margin:4px 0 10px">Minesweeper is installed on this PC.</div><button data-open-app="minesweeper" style="background:#0067b8;color:#fff;border:0;padding:8px 16px;border-radius:2px;font-size:12.5px;cursor:default">Open Minesweeper</button></div></div>`,
  },
  'taskbar': {
    title: 'A love letter to the Windows 10 taskbar',
    h1: 'The taskbar, 1995–2025',
    body: `<p class="edge-p">It began as a strip of grey at the bottom of Windows 95 and became the most recognisable piece of UI in computing. The Windows 10 taskbar is a careful compromise: pinned apps on the left, system tray on the right, and a clock that has been in the same corner for three decades.</p>
    <h2 class="edge-h2">Anatomy</h2>
    <ul style="font-size:13.5px;line-height:1.8;color:#333;padding-left:18px">
      <li><b>Start</b> — the four-pane window that opens everything</li>
      <li><b>Search</b> — the web, Windows, and a bit of Cortana</li>
      <li><b>Task View</b> — every window at once</li>
      <li><b>Pinned apps</b> — the same five apps forever</li>
      <li><b>Tray</b> — where icons go to hide</li>
      <li><b>Clock</b> — and, one click away, the calendar</li>
    </ul>
    <p class="edge-p">Right-click the taskbar in this build. It works.</p>`,
  },
  'support': {
    title: 'Fix a problem in Windows 10',
    h1: 'Troubleshooting',
    body: `<p class="edge-p">Most problems have a boring cause and a boring fix. Here are the classics.</p>
    <h2 class="edge-h2">"My window is stuck"</h2>
    <p class="edge-p">Click the window and press <b>Alt+F4</b>, or right-click it in the taskbar and choose Close. If it refuses, open Task Manager with <b>Ctrl+Shift+Esc</b> and end the task.</p>
    <h2 class="edge-h2">"My taskbar disappeared"</h2>
    <p class="edge-p">You probably ran Show Desktop. Click the Show Desktop strip again, or press <b>Win+D</b>.</p>
    <h2 class="edge-h2">"Everything is orange"</h2>
    <p class="edge-p">Night light is on. Toggle it from the Action Center (Win+A) or Settings &gt; Display.</p>
    <h2 class="edge-h2">"I want my files back"</h2>
    <p class="edge-p">Open the Recycle Bin on the desktop, select an item and choose Restore.</p>`,
  },
  'store': {
    title: 'Microsoft Store — apps and games',
    h1: 'Microsoft Store',
    body: `<p class="edge-p">The Store is where Windows 10 gets its apps. In this build it is fully functional, in the sense that you can look at all the apps you already have.</p>
    <div class="edge-hero"><div class="big">🛍️</div><div><b>Featured today</b><div class="edge-p" style="margin:4px 0 10px">Minesweeper · Paint · Notepad · Calculator</div><button data-open-app="store" style="background:#0f7a4d;color:#fff;border:0;padding:8px 16px;border-radius:2px;font-size:12.5px">Open Store</button></div></div>`,
  },
};

const SEARCH_EXTRA = [
  { title: 'Windows 10 — Wikipedia', url: 'orb://windows-10', desc: 'Windows 10 is a major release of the Windows NT operating system developed by Microsoft. Released on 29 July 2015...' },
  { title: 'The Dreadful Spooky Orb — Field Notes', url: 'orb://spooky-orb', desc: 'The Dreadful Spooky Orb is an unexplained luminous sphere that appears in the corners of old desktop wallpapers...' },
  { title: 'How to actually win at Minesweeper', url: 'orb://minesweeper', desc: 'The 1-2-1 pattern, the 1-2-2-1 pattern, and why your first click should never kill you...' },
  { title: 'A love letter to the Windows 10 taskbar', url: 'orb://taskbar', desc: 'It began as a strip of grey at the bottom of Windows 95 and became the most recognisable piece of UI in computing...' },
  { title: 'Fix a problem in Windows 10', url: 'orb://support', desc: 'Most problems have a boring cause and a boring fix. Here are the classics...' },
];

function homePage() {
  return `<div class="edge-page edge-home">
    <div style="text-align:center;font-size:13px;color:#5b6b7a;letter-spacing:.4px;margin-bottom:14px">Microsoft Edge</div>
    <div class="edge-search-big">${icon('search')}<input id="edge-home-q" placeholder="Search the web" spellcheck="false"><span style="color:#0b7a3e;font-size:11px;font-weight:600">Search</span></div>
    <div class="edge-doodles">
      ${[
        ['Windows 10', 'orb://windows-10', '🪟', '#0067b8'],
        ['Spooky Orb', 'orb://spooky-orb', '🔮', '#744da9'],
        ['Minesweeper', 'orb://minesweeper', '💣', '#c25a2c'],
        ['Taskbar lore', 'orb://taskbar', '🧷', '#0f7a4d'],
        ['Store', 'orb://store', '🛍️', '#107c10'],
        ['Troubleshooting', 'orb://support', '🧰', '#b4009e'],
      ].map(([n, u, e, c]) => `<button class="edge-doodle" data-goto="${u}"><span class="dd" style="background:${c}">${e}</span>${n}</button>`).join('')}
    </div>
    <div style="max-width:620px;margin:28px auto 0">
      <div style="font-size:12.5px;color:#5b6b7a;margin-bottom:8px">Today on the web</div>
      <div style="border:1px solid #e3e8ee;border-radius:8px;overflow:hidden;background:#fff">
        <div style="height:96px;background:linear-gradient(120deg,#0a6ebd,#37d0c6);display:grid;place-items:center;color:#fff;font-size:13px;letter-spacing:.5px">An unusually calm day for the internet</div>
        <div style="padding:12px 14px">
          <div style="font-size:14px;font-weight:600;margin-bottom:4px">Windows 10 turns ten (and a bit)</div>
          <div style="font-size:12px;color:#5b6b7a;line-height:1.5">A browser-based tribute to the operating system that refused to stop being installed.</div>
        </div>
      </div>
    </div>
  </div>`;
}

function searchPage(q) {
  const results = SEARCH_EXTRA.filter((r) => (r.title + r.desc).toLowerCase().includes(q.toLowerCase()));
  const list = results.length ? results : SEARCH_EXTRA;
  const ms = (500 + (q.length * 37) % 4000).toLocaleString();
  return `<div class="edge-page">
    <div style="display:flex;align-items:center;gap:12px;border-bottom:1px solid #eee;padding-bottom:12px;margin-bottom:6px">
      <b style="color:#0b7a3e;font-size:15px">Bing</b>
      <div style="flex:1;max-width:520px;display:flex;align-items:center;border:1px solid #c8c8c8;border-radius:16px;height:34px;padding:0 14px;gap:8px">
        ${icon('search')}<span style="font-size:12.5px">${esc(q)}</span>
      </div>
      <span style="font-size:11.5px;color:#666">${ms} results</span>
    </div>
    ${list.map((r) => `<div class="edge-result" data-goto="${r.url}" style="cursor:default">
      <div class="u">orb://${r.url.replace('orb://', '')} › article</div>
      <div class="t">${esc(r.title)}</div>
      <div class="d">${esc(r.desc)}</div>
    </div>`).join('')}
    <div style="margin-top:18px;font-size:12px;color:#5b6b7a">Searches for <b>${esc(q)}</b> are simulated by the local internet. No data leaves your browser.</div>
  </div>`;
}

function articlePage(slug) {
  const a = ARTICLES[slug];
  if (!a) return null;
  return `<div class="edge-page">
    <div style="font-size:11.5px;color:#0b7a3e;margin-bottom:10px">orb://${slug}</div>
    <h1 class="edge-h1">${a.h1}</h1>
    <div style="font-size:11.5px;color:#6b7580;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:16px">From the Dreadful Spooky Orb local encyclopedia · last edited by you, just now</div>
    ${a.body}
    <div style="margin-top:28px;padding-top:14px;border-top:1px solid #eee;font-size:12px;color:#6b7580">
      <button data-goto="orb://windows-10" style="color:#0067b8;background:none;border:0;padding:0;font-size:12px;cursor:pointer">Windows 10</button> ·
      <button data-goto="orb://taskbar" style="color:#0067b8;background:none;border:0;padding:0;font-size:12px;cursor:pointer">Taskbar</button> ·
      <button data-goto="orb://minesweeper" style="color:#0067b8;background:none;border:0;padding:0;font-size:12px;cursor:pointer">Minesweeper</button>
    </div>
  </div>`;
}

function errorPage(url) {
  return `<div class="edge-page" style="padding-top:60px;text-align:center">
    <div style="font-size:52px;margin-bottom:10px">🌐</div>
    <h1 class="edge-h1" style="font-size:22px">Hmmm… can't reach this page</h1>
    <p class="edge-p" style="max-width:520px;margin:0 auto 6px"><b>${esc(url)}</b> could not be found on the local internet.</p>
    <p class="edge-p" style="max-width:520px;margin:0 auto 18px;color:#5b6b7a">This browser only knows about a handful of pages: try <b>orb://windows-10</b>, <b>orb://taskbar</b> or <b>orb://minesweeper</b>.</p>
    <button data-goto="start" style="background:#0067b8;color:#fff;border:0;padding:9px 18px;border-radius:2px;font-size:12.5px">Back to the home page</button>
    <div style="margin-top:16px;font-size:11.5px;color:#8a949e">ERR_ORB_NOT_FOUND</div>
  </div>`;
}

function resolve(url) {
  url = (url || '').trim();
  if (!url || url === 'start') return { title: 'New tab', kind: 'start', html: homePage(), display: 'start' };
  if (url.startsWith('search:')) {
    const q = url.slice(7);
    return { title: `${q} - Bing`, kind: 'search', html: searchPage(q), display: `bing.com/search?q=${encodeURIComponent(q)}` };
  }
  if (url.startsWith('orb://')) {
    const slug = url.slice(6);
    const html = articlePage(slug);
    if (!html) return { title: 'Hmmm… cannot reach this page', kind: 'error', html: errorPage(url), display: url };
    return { title: ARTICLES[slug].title, kind: 'article', html, display: url };
  }
  return { title: 'Hmmm… cannot reach this page', kind: 'error', html: errorPage(url), display: url };
}

function normalizeInput(input) {
  const v = input.trim();
  if (!v) return 'start';
  if (v === 'start' || v.startsWith('orb://')) return v;
  if (/^https?:\/\//.test(v)) return v;
  if (/\s/.test(v) || !/\./.test(v)) return 'search:' + v;
  return v;
}

export function launch(args = {}) {
  const win = createWindow({
    title: 'New tab - Microsoft Edge', icon: 'edge', width: 1080, height: 700,
    minWidth: 620, minHeight: 400, appId: 'edge',
  });

  let tabs = [];
  let active = 0;
  let tabSeq = 1;

  win.body.innerHTML = `
    <div class="edge">
      <div class="edge-tabs" id="edge-tabs"></div>
      <div class="edge-nav">
        <button class="tb-icon" id="e-back" title="Back">${icon('back')}</button>
        <button class="tb-icon" id="e-fwd" title="Forward">${icon('forward')}</button>
        <button class="tb-icon" id="e-reload" title="Refresh">${icon('refresh')}</button>
        <div class="edge-addr">${icon('globe')}<input id="e-addr" spellcheck="false" placeholder="Search or enter web address"><span id="e-star" title="Add this page to favourites" style="width:16px;height:16px;opacity:.6">${icon('star')}</span></div>
        <button class="tb-icon" title="Favourites" id="e-fav">${icon('star')}</button>
        <button class="tb-icon" title="Downloads" id="e-dl">${icon('download2')}</button>
        <button class="tb-icon" title="Settings" id="e-set">${icon('settings2')}</button>
      </div>
      <div class="edge-view" id="e-view"></div>
    </div>`;

  const tabsEl = win.body.querySelector('#edge-tabs');
  const view = win.body.querySelector('#e-view');
  const addr = win.body.querySelector('#e-addr');

  function newTab(url = 'start') {
    const tab = { id: tabSeq++, url, history: [url], hi: 0, title: 'New tab' };
    tabs.push(tab);
    active = tabs.length - 1;
    render();
    return tab;
  }

  function tab() { return tabs[active]; }

  function navigate(raw, push = true) {
    const url = normalizeInput(raw);
    const t = tab();
    if (!t) return;
    if (push) {
      t.history = t.history.slice(0, t.hi + 1);
      if (t.history[t.hi] !== url) t.history.push(url);
      t.hi = t.history.length - 1;
    }
    t.url = url;
    render();
    addr.value = url === 'start' ? '' : (resolve(url).display || url);
  }

  function render() {
    const t = tab();
    if (!t) return;
    tabsEl.innerHTML = tabs.map((tb, i) => {
      const info = resolve(tb.url);
      return `<button class="edge-tab${i === active ? ' active' : ''}" data-tab="${i}">
        <span style="width:14px;height:14px;display:inline-flex">${icon(i === active ? 'edge' : 'globe')}</span>
        <span class="t">${esc(info.kind === 'start' ? 'New tab' : info.title)}</span>
        ${tabs.length > 1 ? `<span class="x" data-close="${i}">✕</span>` : ''}
      </button>`;
    }).join('') + `<button class="edge-new" id="e-newtab" title="New tab">+</button>`;

    tabsEl.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) {
        e.stopPropagation();
        const i = +e.target.dataset.close;
        tabs.splice(i, 1);
        active = Math.max(0, Math.min(active, tabs.length - 1));
        if (!tabs.length) newTab();
        else render();
        return;
      }
      active = +b.dataset.tab;
      render();
    }));
    tabsEl.querySelector('#e-newtab').addEventListener('click', () => newTab());

    const info = resolve(t.url);
    win.setTitle(`${info.kind === 'start' ? 'New tab' : info.title} - Microsoft Edge`);
    addr.value = info.kind === 'start' ? '' : info.display;
    view.innerHTML = info.html;
    view.scrollTop = 0;

    // page links
    view.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(b.dataset.goto);
    }));
    view.querySelectorAll('[data-open-app]').forEach((b) => b.addEventListener('click', () => openApp(b.dataset.openApp)));
    const homeQ = view.querySelector('#edge-home-q');
    homeQ?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { navigate('search:' + homeQ.value); }
    });

    win.body.querySelector('#e-back').disabled = t.hi <= 0;
    win.body.querySelector('#e-fwd').disabled = t.hi >= t.history.length - 1;
    win.body.querySelector('#e-back').style.opacity = t.hi <= 0 ? '.35' : '1';
    win.body.querySelector('#e-fwd').style.opacity = t.hi >= t.history.length - 1 ? '.35' : '1';
    bus.emit('edge:rendered');
  }

  addr.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { navigate(addr.value); addr.blur(); }
    if (e.key === 'Escape') { addr.value = tab()?.url === 'start' ? '' : resolve(tab().url).display; addr.blur(); }
  });
  addr.addEventListener('focus', () => addr.select());

  win.body.querySelector('#e-back').addEventListener('click', () => {
    const t = tab();
    if (t.hi > 0) { t.hi--; t.url = t.history[t.hi]; render(); }
  });
  win.body.querySelector('#e-fwd').addEventListener('click', () => {
    const t = tab();
    if (t.hi < t.history.length - 1) { t.hi++; t.url = t.history[t.hi]; render(); }
  });
  win.body.querySelector('#e-reload').addEventListener('click', () => {
    const t = tab();
    const info = resolve(t.url);
    view.style.opacity = '.35';
    setTimeout(() => { render(); view.style.opacity = '1'; view.style.transition = 'opacity .15s'; }, 180);
  });
  win.body.querySelector('#e-star').addEventListener('click', () => notify({ title: 'Favourites', body: 'This page was added to your favourites.', icon: 'star' }));
  win.body.querySelector('#e-fav').addEventListener('click', () => notify({ title: 'Favourites', body: 'You have 0 favourites. It is quiet in here.', icon: 'star' }));
  win.body.querySelector('#e-dl').addEventListener('click', () => notify({ title: 'Downloads', body: 'No downloads yet. The internet here is small but polite.', icon: 'download2' }));
  win.body.querySelector('#e-set').addEventListener('click', () => openApp('settings', { page: 'personalization' }));

  newTab(args.query ? 'search:' + args.query : (args.url || 'start'));
  if (args.query) addr.value = 'bing.com/search?q=' + encodeURIComponent(args.query);

  return win;
}
