/* ============================================================
   Microsoft Edge — a small but real browser over a local web
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { esc, bus } from '../utils.js';
import { notify } from '../notify.js';
import { openApp } from '../launcher.js';
import { state, save } from '../store.js';

export const meta = { id: 'edge', name: 'Microsoft Edge', icon: 'edge' };

/* ------------------------------------------------------------------
   The local internet. Every site is a function of (path, query).
   ------------------------------------------------------------------ */

const SITES = {
  'orb.local': {
    name: 'Orb',
    colour: '#744da9',
    pages: { '/': 'home' },
  },
  'bing.com': { name: 'Bing', colour: '#0b7a3e' },
  'wikipedia.org': { name: 'Wikipedia', colour: '#333333' },
  'github.com': { name: 'GitHub', colour: '#24292f' },
  'news.orb': { name: 'Orb News', colour: '#b4009e' },
  'youtube.com': { name: 'YouTube', colour: '#c4302b' },
  'minesweeper.org': { name: 'Minesweeper', colour: '#c25a2c' },
  'weather.orb': { name: 'Weather', colour: '#0a6ebd' },
  'store.orb': { name: 'Store', colour: '#107c10' },
  'windows.com': { name: 'Microsoft', colour: '#0067b8' },
  'microsoft.com': { name: 'Microsoft', colour: '#0067b8' },
};

const ARTICLES = {
  windows_10: {
    title: 'Windows 10 - Wikipedia',
    h1: 'Windows 10',
    body: `<p class="edge-p"><b>Windows 10</b> is a major release of the Windows NT operating system developed by Microsoft. Released on 29 July 2015, it reintroduced the Start menu, added virtual desktops, the Action Center, Continuum and a unified app platform.</p>
      <p class="edge-p">Windows 10 was described by Microsoft as "the last version of Windows", a claim quietly retired when Windows 11 shipped in 2021. It remains one of the most widely installed desktop operating systems.</p>
      <h2 class="edge-h2">Key features</h2>
      <ul class="edge-list">
        <li>The return of the Start menu, with live tiles</li>
        <li>A unified taskbar with search, Task View and the system tray</li>
        <li>Snap Assist, plus snapping to halves and quarters</li>
        <li>The Action Center for notifications and quick actions</li>
        <li>Universal Windows Platform apps from the Microsoft Store</li>
      </ul>
      <div class="edge-hero"><div class="big">🪟</div><div><b>The shell you are using right now</b>
        <div class="edge-p" style="margin:4px 0 0">Every pixel of this desktop is HTML, CSS and JavaScript. No virtualisation, no remote desktop — one page pretending to be an operating system.</div></div></div>
      <h2 class="edge-h2">Support ended</h2>
      <p class="edge-p">Mainstream support for Windows 10 ended on 14 October 2025. This page, however, will keep running as long as your browser does.</p>`,
  },
  minesweeper: {
    title: 'Minesweeper - Wikipedia',
    h1: 'Minesweeper',
    body: `<p class="edge-p"><b>Minesweeper</b> is a logic puzzle game included with Windows since 3.0. The board hides mines; each revealed cell shows how many mines touch it. The goal is to clear every safe cell without detonating anything.</p>
      <h2 class="edge-h2">The 1-2-1 pattern</h2>
      <p class="edge-p">Along a wall, a sequence of <b>1 2 1</b> always means the mines sit under the outer numbers and the middle cell is safe. Learn it; it will save your life.</p>
      <h2 class="edge-h2">The 1-2-2-1 pattern</h2>
      <p class="edge-p">Similarly, <b>1 2 2 1</b> hides mines beneath both 2s. Clear the 1s and the rest follows.</p>
      <div class="edge-hero"><div class="big">💣</div><div><b>Try it now</b>
        <div class="edge-p" style="margin:4px 0 10px">Minesweeper is installed on this PC, with three difficulties and a best-time board.</div>
        <button class="edge-btn" data-open-app="minesweeper">Open Minesweeper</button></div></div>`,
  },
  taskbar: {
    title: 'Taskbar - Wikipedia',
    h1: 'Taskbar',
    body: `<p class="edge-p">The <b>taskbar</b> began as a strip of grey at the bottom of Windows 95 and became the most recognisable piece of UI in computing. The Windows 10 taskbar is a careful compromise: pinned apps on the left, system tray on the right, and a clock that has been in the same corner for three decades.</p>
      <h2 class="edge-h2">Anatomy</h2>
      <ul class="edge-list">
        <li><b>Start</b> — the four-pane window that opens everything</li>
        <li><b>Search</b> — the web, Windows, and a bit of Cortana</li>
        <li><b>Task View</b> — every window at once</li>
        <li><b>Pinned apps</b> — the same five apps forever</li>
        <li><b>Tray</b> — where icons go to hide</li>
        <li><b>Clock</b> — and, one click away, the calendar</li>
      </ul>
      <p class="edge-p">Right-click the taskbar in this build. It works.</p>`,
  },
  spooky_orb: {
    title: 'The Dreadful Spooky Orb - Wikipedia',
    h1: 'The Dreadful Spooky Orb',
    body: `<p class="edge-p">The <b>Dreadful Spooky Orb</b> is an unexplained luminous sphere that appears in the corners of old desktop wallpapers. Witnesses describe a soft violet glow, a faint hum in the key of B minor, and the irresistible urge to rearrange their taskbar.</p>
      <h2 class="edge-h2">Reported behaviour</h2>
      <ul class="edge-list">
        <li>Appears when you hover the Show Desktop strip</li>
        <li>Moves your desktop icons exactly one grid cell to the left</li>
        <li>Occasionally opens Minesweeper unprompted</li>
      </ul>
      <div class="edge-hero"><div class="big">🔮</div><div><b>Do not taunt the orb</b>
        <div class="edge-p" style="margin:4px 0 0">It is, at worst, mildly dreadful.</div></div></div>
      <p class="edge-p">If you encounter the orb, stay calm, finish your save, and click the desktop exactly once.</p>`,
  },
  edge_browser: {
    title: 'Microsoft Edge - Wikipedia',
    h1: 'Microsoft Edge',
    body: `<p class="edge-p"><b>Microsoft Edge</b> is a Chromium-based web browser. It replaced Internet Explorer in 2015 with the launch of Windows 10, and became the default browser on Windows in 2021.</p>
      <p class="edge-p">This copy is somewhat smaller than the real thing. It renders ten sites, keeps tabs and history, remembers favourites and has never once asked you to finish setting it up.</p>
      <h2 class="edge-h2">Keyboard shortcuts</h2>
      <ul class="edge-list">
        <li><b>Ctrl+L</b> — focus the address bar</li>
        <li><b>Ctrl+T</b> / <b>Ctrl+W</b> — new tab / close tab</li>
        <li><b>Alt+←</b> / <b>Alt+→</b> — back and forward</li>
        <li><b>Enter</b> in the address bar — go</li>
      </ul>`,
  },
};

const NEWS = [
  {
    id: 'orb-sighting',
    title: 'Orb sighted above taskbar, again',
    kicker: 'Local',
    body: `Residents of the lower right corner of the screen report a soft violet glow for the third night running. Authorities say the orb is "load-bearing" and should not be removed.<br><br>Witnesses describe a faint hum at roughly 60 Hz. Engineers measured it, shrugged, and went for lunch.`,
  },
  {
    id: 'taskbar-alignment',
    title: 'Taskbar alignment debate enters ninth year',
    kicker: 'Policy',
    body: `The question of whether app icons belong on the left or the centre of the taskbar remains unresolved in this build.<br><br>Both factions agree the clock should stay on the right. Neither faction will comment on the start button.`,
  },
  {
    id: 'minesweeper-record',
    title: 'Minesweeper beginner record falls to 3 seconds',
    kicker: 'Sport',
    body: `A new beginner-level record of three seconds has been ratified by the committee, after a short investigation into whether the player simply guessed.<br><br>They did. The committee has decided this is allowed.`,
  },
];

const VIDEOS = [
  { id: 'v1', title: 'Building an operating system in a browser tab', ch: 'Scope Develop', mins: '18:42', views: '412K', tint: ['#1d2b64', '#7b47ff'] },
  { id: 'v2', title: 'Every Windows startup sound, in order', ch: 'Sound Archive', mins: '6:11', views: '1.8M', tint: ['#0a3d62', '#1e90ff'] },
  { id: 'v3', title: 'I played Minesweeper for 12 hours straight', ch: 'Dreadful Games', mins: '24:05', views: '96K', tint: ['#5b2a06', '#ff9e64'] },
  { id: 'v4', title: 'The orb explained (it is not explained)', ch: 'Orb Studies', mins: '11:30', views: '2.3M', tint: ['#3b1e7a', '#12f7d6'] },
  { id: 'v5', title: 'Taskbar alignment: a documentary', ch: 'UI History', mins: '41:58', views: '77K', tint: ['#0d5c4a', '#8bd450'] },
  { id: 'v6', title: 'CSS tricks that should not work', ch: 'Scope Develop', mins: '14:02', views: '655K', tint: ['#2b2b31', '#8b98a6'] },
];

/* ------------------------------------------------------------------ helpers */

const card = (title, desc, url, emoji, colour) => `
  <button class="edge-card" data-goto="${esc(url)}">
    <span class="edge-card-dot" style="background:${colour}">${emoji}</span>
    <span class="edge-card-t"><b>${esc(title)}</b><span>${esc(desc)}</span></span>
  </button>`;

const wrap = (inner, extra = '') => `<div class="edge-page" ${extra}>${inner}</div>`;

/* ------------------------------------------------------------------ pages */

function homePage(ctx) {
  const favs = (state.browser?.favs || []).slice(0, 6);
  return `<div class="edge-page edge-home">
    <div class="edge-brand">${icon('edge', 26)}<span>Microsoft Edge</span></div>
    <div class="edge-search-big">
      ${icon('search')}
      <input id="edge-home-q" placeholder="Search the web" spellcheck="false" autocomplete="off">
      <button class="edge-go" id="edge-home-go">Search</button>
    </div>
    <div class="edge-doodles">
      ${[
        ['Wikipedia', 'https://wikipedia.org', '📚', '#333'],
        ['Bing', 'https://bing.com', '🔎', '#0b7a3e'],
        ['GitHub', 'https://github.com/scope-develop', '🐙', '#24292f'],
        ['Orb News', 'https://news.orb', '📰', '#b4009e'],
        ['YouTube', 'https://youtube.com', '▶', '#c4302b'],
        ['Minesweeper', 'https://minesweeper.org', '💣', '#c25a2c'],
        ['Weather', 'https://weather.orb', '⛅', '#0a6ebd'],
        ['Store', 'https://store.orb', '🛍️', '#107c10'],
      ].map(([n, u, e, c]) => `<button class="edge-doodle" data-goto="${u}"><span class="dd" style="background:${c}">${e}</span>${n}</button>`).join('')}
    </div>

    ${favs.length ? `<div class="edge-strip">
      <div class="edge-strip-h">Favourites</div>
      <div class="edge-strip-row">${favs.map((f) => `<button class="edge-chip-btn" data-goto="${esc(f.url)}">${icon('star')}${esc(f.title)}</button>`).join('')}</div>
    </div>` : ''}

    <div class="edge-strip">
      <div class="edge-strip-h">Discover</div>
      <div class="edge-cards">
        ${card('Windows 10 turns ten', 'A tribute to the OS that refused to stop being installed', 'https://wikipedia.org/wiki/windows_10', '🪟', '#0067b8')}
        ${card('The orb, explained', 'It is not explained. The article is still very good.', 'https://wikipedia.org/wiki/spooky_orb', '🔮', '#744da9')}
        ${card('Taskbar lore', 'Thirty years in the same corner of the screen', 'https://wikipedia.org/wiki/taskbar', '🧷', '#0f7a4d')}
        ${card('Today on Orb News', 'Three headlines, all load-bearing', 'https://news.orb', '📰', '#b4009e')}
        ${card('Watch something', 'Videos about taskbars and orbs', 'https://youtube.com', '▶', '#c4302b')}
        ${card('Get the Store', 'Everything is already installed', 'https://store.orb', '🛍️', '#107c10')}
      </div>
    </div>
    <div class="edge-foot">This internet is local. ${ctx.history.length} pages viewed this session · ${(state.browser?.favs || []).length} favourites</div>
  </div>`;
}

function bingPage(path, params, ctx) {
  if (!path.startsWith('/search')) {
    return wrap(`<div style="text-align:center;padding:60px 0 10px">
        <div style="font-size:34px;font-weight:600;color:#0b7a3e;letter-spacing:-1px;margin-bottom:18px">Bing</div>
        <div class="edge-search-big" style="margin-bottom:10px">${icon('search')}
          <input id="edge-home-q" placeholder="Search the web" spellcheck="false">
          <button class="edge-go" id="edge-home-go">Search</button></div>
        <div style="font-size:11.5px;color:#6b7580">Searches are answered by the local internet. Nothing leaves this tab.</div>
      </div>
      <div class="edge-cards" style="max-width:640px;margin:34px auto 0">
        ${['windows 10', 'minesweeper patterns', 'taskbar history', 'the orb'].map((t) => card(t, 'Trending search on this PC', `https://bing.com/search?q=${encodeURIComponent(t)}`, '🔎', '#0b7a3e')).join('')}
      </div>`);
  }
  const q = params.q || '';
  const needle = q.toLowerCase();
  const pool = [
    { url: 'https://wikipedia.org/wiki/windows_10', title: 'Windows 10 - Wikipedia', desc: 'Windows 10 is a major release of the Windows NT operating system. Released 29 July 2015; reintroduced the Start menu and added virtual desktops.' },
    { url: 'https://wikipedia.org/wiki/minesweeper', title: 'Minesweeper - Wikipedia', desc: 'Minesweeper is a logic puzzle game included with Windows since 3.0. The 1-2-1 pattern, the 1-2-2-1 pattern and why the first click matters.' },
    { url: 'https://wikipedia.org/wiki/taskbar', title: 'Taskbar - Wikipedia', desc: 'The taskbar began as a strip of grey at the bottom of Windows 95 and became the most recognisable piece of UI in computing.' },
    { url: 'https://wikipedia.org/wiki/spooky_orb', title: 'The Dreadful Spooky Orb - Wikipedia', desc: 'An unexplained luminous sphere that appears in the corners of old desktop wallpapers. Reported to hum at 60 Hz.' },
    { url: 'https://wikipedia.org/wiki/edge_browser', title: 'Microsoft Edge - Wikipedia', desc: 'Chromium-based browser that replaced Internet Explorer in 2015. Tabs, history, favourites, and one very small internet.' },
    { url: 'https://github.com/scope-develop', title: 'scope-develop · GitHub', desc: 'The repository behind this desktop: vanilla ES modules, no frameworks, no build step, zero runtime dependencies.' },
    { url: 'https://minesweeper.org', title: 'Play Minesweeper online', desc: 'Three difficulties, a real timer and a best-time board that survives a reload. Right-click plants a flag.' },
    { url: 'https://news.orb', title: 'Orb News — today', desc: 'Orb sighted above taskbar again · Taskbar alignment debate enters ninth year · Minesweeper record falls to 3 seconds.' },
    { url: 'https://youtube.com', title: 'YouTube — taskbars, orbs and CSS', desc: 'Six videos about building an operating system in a browser tab, and one about startup sounds.' },
    { url: 'https://store.orb', title: 'Microsoft Store — apps and games', desc: 'Sixteen apps with detail pages, ratings and screenshots. All of them already installed.' },
  ];
  const words = needle.split(/\s+/).filter(Boolean);
  const scored = pool
    .map((p) => ({ ...p, score: words.filter((w) => (p.title + p.desc).toLowerCase().includes(w)).length }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);
  const results = scored.length ? scored : pool.slice(0, 6);
  const count = (12400 + (q.length * 8137) % 90000).toLocaleString('en-GB');

  return wrap(`<div class="edge-bing-bar">
      <span class="edge-bing-logo">Bing</span>
      <div class="edge-addr" style="max-width:520px">${icon('search')}
        <input id="edge-home-q" value="${esc(q)}" spellcheck="false">
        <button class="edge-go" id="edge-home-go">Search</button></div>
      <span style="font-size:11.5px;color:#666;margin-left:auto">${count} results</span>
    </div>
    ${results.map((r) => `<div class="edge-result" data-goto="${esc(r.url)}">
      <div class="u">${esc(r.url.replace(/^https?:\/\//, '').split('/').slice(0, 2).join(' › '))}</div>
      <div class="t">${esc(r.title)}</div>
      <div class="d">${esc(r.desc)}</div>
    </div>`).join('')}
    <div style="margin-top:20px;font-size:12px;color:#5b6b7a">
      Results for <b>${esc(q)}</b> are simulated by the local internet. Try
      ${['windows 10', 'minesweeper', 'orb'].map((t) => `<button class="edge-link" data-goto="https://bing.com/search?q=${encodeURIComponent(t)}">${t}</button>`).join(' · ')}.
    </div>`);
}

function wikipediaPage(path) {
  const slug = (path.split('/wiki/')[1] || '').replace(/\/$/, '');
  const article = ARTICLES[slug];
  const list = Object.keys(ARTICLES);
  const sidebar = `<div class="edge-wiki-side">
      <div class="edge-wiki-logo">${icon('globe')} Wikipedia</div>
      ${list.map((s) => `<button class="edge-wiki-link${s === slug ? ' active' : ''}" data-goto="https://wikipedia.org/wiki/${s}">${esc(ARTICLES[s].h1)}</button>`).join('')}
      <div class="edge-wiki-note">The free encyclopedia that only knows five things.</div>
    </div>`;

  if (!article && !slug) {
    return `<div class="edge-wiki">${sidebar}<div class="edge-wiki-main">
      <div class="edge-wiki-crumb">Wikipedia</div>
      <h1 class="edge-h1">The free encyclopedia</h1>
      <div class="edge-wiki-meta">Five articles, hand-written, no citations required</div>
      <p class="edge-p">Welcome to the local Wikipedia. It covers the things this desktop cares about: itself, its taskbar, its games, and the orb.</p>
      <div class="edge-cards">${list.map((s2) => card(ARTICLES[s2].h1, ARTICLES[s2].body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90) + '…', `https://wikipedia.org/wiki/${s2}`, '📖', '#333')).join('')}</div>
    </div></div>`;
  }
  if (!article) {
    return `<div class="edge-wiki">${sidebar}<div class="edge-wiki-main">
      <h1 class="edge-h1">No article here</h1>
      <p class="edge-p">There is no page called <b>${esc(slug || 'that')}</b> in this encyclopedia. The librarian is sorry, and mildly surprised.</p>
      <div class="edge-cards">${list.map((s) => card(ARTICLES[s].h1, 'Read the article', `https://wikipedia.org/wiki/${s}`, '📖', '#333')).join('')}</div>
    </div></div>`;
  }
  return `<div class="edge-wiki">${sidebar}<div class="edge-wiki-main">
    <div class="edge-wiki-crumb">Wikipedia › ${esc(article.h1)}</div>
    <h1 class="edge-h1">${esc(article.h1)}</h1>
    <div class="edge-wiki-meta">From the local encyclopedia · last edited just now · ${article.body.length} characters</div>
    ${article.body}
    <div class="edge-wiki-links">
      <span>Read next:</span>
      ${list.filter((s) => s !== slug).map((s) => `<button class="edge-link" data-goto="https://wikipedia.org/wiki/${s}">${esc(ARTICLES[s].h1)}</button>`).join(' · ')}
    </div>
  </div></div>`;
}

function githubPage() {
  const files = [
    ['public/', 'folder'], ['README.md', 'file'], ['vercel.json', 'file'],
    ['app/', 'folder'], ['theme/', 'folder'], ['assets/', 'folder'],
  ];
  return wrap(`<div class="edge-gh">
    <div class="edge-gh-head">
      <span style="width:26px;height:26px;display:inline-flex;color:#24292f">${icon('globe', 26)}</span>
      <span><b>scope-develop</b> / <b>windows-browser</b></span>
      <span class="edge-chip" style="margin-left:auto">Public</span>
    </div>
    <p class="edge-p" style="color:#57606a">A complete Windows 10 desktop environment in the browser — window manager, 18 apps, zero dependencies.</p>
    <div class="edge-gh-meta">
      <span>⭐ ${(1260 + (state.browser?.favs?.length || 0)).toLocaleString('en-GB')} stars</span>
      <span>⑂ 148 forks</span>
      <span>watch 22</span>
      <span>main · 42 commits</span>
    </div>
    <div class="edge-gh-repo">
      ${files.map(([n, t]) => `<div class="edge-gh-file"><span>${t === 'folder' ? '📁' : '📄'}</span>${esc(n)}</div>`).join('')}
    </div>
    <div class="edge-gh-readme">
      <b>README.md</b>
      <h2 class="edge-h2">Windows Browser</h2>
      <p class="edge-p">Windows 10, rebuilt from scratch with plain HTML, CSS and JavaScript ES modules. No framework, no bundler, no build step, no runtime dependencies.</p>
      <ul class="edge-list">
        <li>Window manager: drag, resize, snap, maximise, minimise, task view</li>
        <li>18 applications sharing one in-memory file system</li>
        <li>Light and dark themes, accent colours, six wallpapers</li>
        <li>Works on a phone: full-screen windows, long-press menus</li>
      </ul>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="edge-btn" data-open-app="terminal">Open the terminal</button>
        <button class="edge-btn" data-open-app="welcome">Get started</button>
        <button class="edge-btn" data-open-app="credits">Credits</button>
      </div>
    </div>
    <div class="edge-foot">Live site: windows10-in-browser.vercel.app</div>
  </div>`);
}

function newsPage(path, params) {
  const article = NEWS.find((n) => path.includes(n.id));
  if (article) {
    return wrap(`<div style="font-size:11.5px;color:#b4009e;letter-spacing:1px;text-transform:uppercase;font-weight:700">${esc(article.kicker)}</div>
      <h1 class="edge-h1" style="margin-top:6px">${esc(article.title)}</h1>
      <div class="edge-wiki-meta">By Orb News staff · ${ctxDate()}</div>
      <p class="edge-p" style="font-size:14.5px">${article.body}</p>
      <div class="edge-wiki-links"><span>More:</span>
        ${NEWS.filter((n) => n.id !== article.id).map((n) => `<button class="edge-link" data-goto="https://news.orb/${n.id}">${esc(n.title)}</button>`).join(' · ')}
      </div>`);
  }
  return wrap(`<div class="edge-masthead"><span style="font-weight:700;font-size:20px;letter-spacing:-.4px">Orb News</span>
      <span style="font-size:11.5px;color:#6b7580">Local · ${ctxDate()}</span></div>
    ${NEWS.map((n) => `<button class="edge-news-item" data-goto="https://news.orb/${n.id}">
      <span class="edge-news-kick">${esc(n.kicker)}</span>
      <span class="edge-news-title">${esc(n.title)}</span>
      <span class="edge-news-desc">${esc(n.body.replace(/<br><br>/g, ' ').slice(0, 130))}…</span>
    </button>`).join('')}
    <div class="edge-foot">Orb News is written by the orb, about the orb, for people who use the taskbar.</div>`);
}

function youtubePage(path, params) {
  const video = path.startsWith('/watch') ? VIDEOS.find((v) => v.id === params.v) : null;
  if (video) {
    return wrap(`<div class="edge-yt-watch">
      <div class="edge-yt-player" style="background:linear-gradient(135deg,${video.tint[0]},${video.tint[1]})">
        <span style="width:64px;height:64px;display:inline-flex;opacity:.9">${icon('play', 64)}</span>
        <div class="edge-yt-time">${video.mins}</div>
      </div>
      <h1 class="edge-h1" style="font-size:20px;margin:14px 0 6px">${esc(video.title)}</h1>
      <div class="edge-wiki-meta">${video.views} views · ${esc(video.ch)} · this video is imaginary</div>
      <div style="display:flex;gap:8px;margin:12px 0">
        <button class="edge-btn" data-open-app="media">Open Groove Music</button>
        <button class="edge-btn" data-goto="https://youtube.com">Back to YouTube</button>
      </div>
      <div class="edge-yt-comments">
        <b style="font-size:12.5px">Comments · 3</b>
        ${[
          ['@taskbar_historian', 'I have watched this four times and I still do not know where the taskbar ends.'],
          ['@orb_watcher', 'the orb at 2:14 👁'],
          ['@scope_develop', 'thanks for watching, the whole desktop is real'],
        ].map(([u, c]) => `<div class="edge-yt-comment"><span class="av">${u[1].toUpperCase()}</span><div><b>${u}</b><div>${esc(c)}</div></div></div>`).join('')}
      </div>
    </div>`);
  }
  return wrap(`<div class="edge-yt-head"><span class="edge-yt-logo">▶ YouTube</span>
      <span style="font-size:11.5px;color:#6b7580">${VIDEOS.length} videos · all of them local</span></div>
    <div class="edge-yt-grid">
      ${VIDEOS.map((v) => `<button class="edge-yt-card" data-goto="https://youtube.com/watch?v=${v.id}">
        <span class="edge-yt-thumb" style="background:linear-gradient(135deg,${v.tint[0]},${v.tint[1]})">
          <span style="width:34px;height:34px;display:inline-flex;opacity:.85">${icon('play', 34)}</span>
          <span class="edge-yt-time">${v.mins}</span>
        </span>
        <span class="edge-yt-title">${esc(v.title)}</span>
        <span class="edge-yt-meta">${esc(v.ch)} · ${v.views} views</span>
      </button>`).join('')}
    </div>`);
}

function minesweeperSite() {
  return wrap(`<div style="text-align:center;padding:20px 0">
      <div style="font-size:44px">💣</div>
      <h1 class="edge-h1" style="margin:6px 0">Play Minesweeper</h1>
      <p class="edge-p" style="max-width:520px;margin:0 auto 16px">Three difficulties. A guaranteed safe first click. A best-time board that survives a reload. Right-click plants a flag — long-press on a phone.</p>
      <button class="edge-btn" data-open-app="minesweeper" style="font-size:13px;padding:10px 22px">Launch the game</button>
      <div class="edge-hero" style="max-width:560px;margin:26px auto 0;text-align:left">
        <div class="big">🧠</div><div><b>Strategy</b>
        <div class="edge-p" style="margin:4px 0 0">Read
          <button class="edge-link" data-goto="https://wikipedia.org/wiki/minesweeper">the patterns article</button>
          before attempting expert. The 1-2-1 is your friend.</div></div>
      </div>
    </div>`);
}

function weatherSite() {
  const days = [['Today', 18, 'Partly cloudy'], ['Tomorrow', 16, 'Light rain'], ['Friday', 15, 'Showers'], ['Saturday', 19, 'Sunny'], ['Sunday', 21, 'Sunny']];
  return wrap(`<div class="edge-weather-head">
      <div><div style="font-size:12px;color:#6b7580">Paris, Île-de-France</div>
      <div style="font-size:52px;font-weight:300;line-height:1">18°</div>
      <div class="edge-p" style="margin:2px 0 0">Partly cloudy · feels like 17°</div></div>
      <div style="font-size:54px">⛅</div>
    </div>
    <div class="edge-weather-days">
      ${days.map(([d, t, c]) => `<div class="edge-weather-day"><b>${d}</b><span>${t}°</span><span style="color:#6b7580">${c}</span></div>`).join('')}
    </div>
    <div style="margin-top:18px"><button class="edge-btn" data-open-app="weather">Open the Weather app</button></div>
    <div class="edge-foot">Data is decorative. The orb controls the climate.</div>`);
}

function storeSite() {
  const apps = [['minesweeper', 'Minesweeper', '4.8'], ['paint', 'Paint', '4.5'], ['notepad', 'Notepad', '4.7'], ['calculator', 'Calculator', '4.6'], ['terminal', 'Windows Terminal', '4.9'], ['media', 'Groove Music', '4.1']];
  return wrap(`<div class="edge-bing-bar"><span class="edge-bing-logo" style="color:#107c10">Store</span>
      <span style="font-size:11.5px;color:#666">Everything is already installed. That is the beauty of a closed ecosystem.</span></div>
    <div class="edge-cards">
      ${apps.map(([id, name, rating]) => `<button class="edge-card" data-open-app="${id}">
        <span class="edge-card-dot" style="background:#107c10">${icon(id === 'minesweeper' ? 'mine' : id, 18)}</span>
        <span class="edge-card-t"><b>${esc(name)}</b><span>★ ${rating} · Free · Open</span></span></button>`).join('')}
    </div>
    <div style="margin-top:16px"><button class="edge-btn" data-open-app="store">Open the Store app</button></div>`);
}

function windowsSite() {
  return wrap(`<div class="edge-ms-hero">
      <div>
        <div style="font-size:11.5px;letter-spacing:1.4px;text-transform:uppercase;opacity:.8">Microsoft</div>
        <h1 class="edge-h1" style="color:#fff;margin:8px 0 10px">Windows 10, in a tab</h1>
        <p class="edge-p" style="color:rgba(255,255,255,.86);max-width:420px">The Start menu, the taskbar, the snap layouts, eighteen apps and a file system — all rendered by the page you are already looking at.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="edge-btn light" data-open-app="welcome">Get started</button>
          <button class="edge-btn light" data-goto="https://wikipedia.org/wiki/windows_10">Read about Windows 10</button>
        </div>
      </div>
      <div style="font-size:76px">🪟</div>
    </div>
    <div class="edge-cards" style="margin-top:22px">
      ${card('File Explorer', 'A real file system, in your browser', 'https://github.com/scope-develop', '📁', '#0067b8')}
      ${card('Minesweeper', 'The classic, guaranteed fair first click', 'https://minesweeper.org', '💣', '#c25a2c')}
      ${card('Microsoft Edge', 'The browser you are using, inside the browser', 'https://wikipedia.org/wiki/edge_browser', '🌐', '#0b7a3e')}
    </div>`);
}

/* internal chrome pages */
function internalPage(name, ctx) {
  if (name === 'history') {
    return wrap(`<h1 class="edge-h1">History</h1>
      <p class="edge-p" style="color:#57606a">${ctx.history.length} pages this session.</p>
      <div class="edge-gh-repo">
        ${ctx.history.slice().reverse().map((h) => `<div class="edge-gh-file" data-goto="${esc(h.url)}" style="cursor:default"><span>🕘</span>${esc(h.title)}<span style="margin-left:auto;color:#8a949e;font-size:11px">${esc(h.url)}</span></div>`).join('') || '<div style="padding:14px;color:#8a949e">Nothing yet.</div>'}
      </div>
      <div style="margin-top:14px"><button class="edge-btn" onclick="0" data-goto="edge://downloads">Downloads</button></div>`);
  }
  if (name === 'downloads') {
    return wrap(`<h1 class="edge-h1">Downloads</h1>
      <p class="edge-p" style="color:#57606a">One file, because the internet here is small but polite.</p>
      <div class="edge-gh-repo">
        <div class="edge-gh-file"><span>📄</span>release-notes.txt<span style="margin-left:auto;color:#8a949e;font-size:11px">2 KB · complete</span></div>
        <div class="edge-gh-file" data-open-app="explorer" style="cursor:default"><span>📁</span>Open the Downloads folder<span style="margin-left:auto;color:#8a949e;font-size:11px">C:\\Users\\Alex\\Downloads</span></div>
      </div>`);
  }
  if (name === 'favorites' || name === 'favourites') {
    const favs = state.browser?.favs || [];
    return wrap(`<h1 class="edge-h1">Favourites</h1>
      <p class="edge-p" style="color:#57606a">${favs.length} saved ${favs.length === 1 ? 'page' : 'pages'}.</p>
      <div class="edge-gh-repo">
        ${favs.map((f) => `<div class="edge-gh-file" data-goto="${esc(f.url)}" style="cursor:default"><span>⭐</span>${esc(f.title)}<span style="margin-left:auto;color:#8a949e;font-size:11px">${esc(f.url)}</span></div>`).join('') || '<div style="padding:14px;color:#8a949e">Nothing saved yet. Press the star in the address bar on any page.</div>'}
      </div>`);
  }
  if (name === 'settings') {
    const b = state.browser || (state.browser = { favs: [], history: [] });
    return wrap(`<h1 class="edge-h1">Settings</h1>
      <div class="edge-gh-repo" style="padding:4px 0">
        <div class="edge-gh-file"><span>🏠</span>Home page<span style="margin-left:auto;color:#8a949e">edge://start</span></div>
        <div class="edge-gh-file"><span>⭐</span>Favourites<span style="margin-left:auto;color:#8a949e">${(b.favs || []).length} saved</span></div>
        <div class="edge-gh-file"><span>🕘</span>History<span style="margin-left:auto;color:#8a949e">${ctx.history.length} this session</span></div>
        <div class="edge-gh-file"><span>🌐</span>Search engine<span style="margin-left:auto;color:#8a949e">Bing (the local one)</span></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
        <button class="edge-btn" data-action="clear-favs">Clear favourites</button>
        <button class="edge-btn" data-action="clear-history">Clear history</button>
        <button class="edge-btn" data-open-app="settings">Windows Settings</button>
      </div>`);
  }
  return wrap(`<h1 class="edge-h1">edge://${esc(name)}</h1>
    <p class="edge-p">This internal page does not exist. Try <button class="edge-link" data-goto="edge://history">history</button>,
    <button class="edge-link" data-goto="edge://favorites">favourites</button>,
    <button class="edge-link" data-goto="edge://downloads">downloads</button> or
    <button class="edge-link" data-goto="edge://settings">settings</button>.</p>`);
}

function errorPage(url) {
  return wrap(`<div style="padding:40px 0;text-align:center">
      <div style="font-size:54px;margin-bottom:10px">🌐</div>
      <h1 class="edge-h1" style="font-size:22px">Hmmm… can't reach this page</h1>
      <p class="edge-p" style="max-width:520px;margin:0 auto 6px"><b>${esc(url)}</b> is not on the local internet.</p>
      <p class="edge-p" style="max-width:520px;margin:0 auto 16px;color:#5b6b7a">This browser knows about eleven sites. Anything else becomes a search.</p>
      <div class="edge-cards" style="max-width:620px;margin:0 auto;text-align:left">
        ${Object.entries(SITES).slice(0, 6).map(([host, s]) => card(s.name, host, `https://${host}`, '🌐', s.colour)).join('')}
      </div>
      <div style="margin-top:18px;font-size:11.5px;color:#8a949e">ERR_ORB_NOT_FOUND</div>
    </div>`);
}

function ctxDate() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ------------------------------------------------------------------ resolve */

function parseUrl(raw, base) {
  let v = (raw || '').trim();
  if (!v || v === 'start' || v === 'edge://start' || v === 'about:home') {
    return { kind: 'start', url: 'edge://start', display: '' };
  }
  if (/^edge:\/\//i.test(v)) {
    return { kind: 'internal', url: v, name: v.replace(/^edge:\/\//i, '').replace(/\/$/, '').toLowerCase(), display: v };
  }
  if (/^orb:\/\//i.test(v)) {
    const slug = v.slice(6);
    if (ARTICLES[slug]) return { kind: 'site', host: 'wikipedia.org', path: '/wiki/' + slug, url: 'https://wikipedia.org/wiki/' + slug, display: 'wikipedia.org/wiki/' + slug };
    v = 'https://' + slug;
  }
  // relative in-site links (only for page links, never for typed text)
  if (base && base.host && !/\s/.test(v) && !/^[a-z]+:\/\//i.test(v) && !/^[\w-]+\./.test(v)) {
    const p = base.path.replace(/\/[^/]*$/, '/');
    v = `https://${base.host}${v.startsWith('/') ? v : p + v}`;
  }
  if (!/^[a-z]+:\/\//i.test(v)) {
    if (/\s/.test(v) || !/\./.test(v.split('/')[0])) {
      return { kind: 'search', q: v, url: 'https://bing.com/search?q=' + encodeURIComponent(v), display: 'bing.com/search?q=' + encodeURIComponent(v) };
    }
    v = 'https://' + v;
  }
  let u;
  try { u = new URL(v); } catch (_) {
    return { kind: 'search', q: v, url: 'https://bing.com/search?q=' + encodeURIComponent(v), display: 'bing.com/search?q=' + encodeURIComponent(v) };
  }
  const host = u.hostname.replace(/^www\./, '');
  const params = Object.fromEntries(u.searchParams.entries());
  if (host === 'bing.com' || host === 'google.com') {
    if (params.q) return { kind: 'search', q: params.q, url: `https://bing.com/search?q=${encodeURIComponent(params.q)}`, display: `bing.com/search?q=${params.q}` };
    return { kind: 'site', host: 'bing.com', path: '/', params, url: 'https://bing.com', display: 'bing.com' };
  }
  if (SITES[host]) {
    return { kind: 'site', host, path: u.pathname || '/', params, url: `https://${host}${u.pathname === '/' ? '' : u.pathname}${u.search}`, display: `${host}${u.pathname === '/' ? '' : u.pathname}${u.search}` };
  }
  // friendly aliases
  const alias = { 'wikipedia.com': 'wikipedia.org', 'en.wikipedia.org': 'wikipedia.org', 'youtu.be': 'youtube.com', 'github.com': null };
  if (alias[host] && SITES[alias[host]]) {
    return { kind: 'site', host: alias[host], path: u.pathname || '/', params, url: `https://${alias[host]}${u.pathname}`, display: `${alias[host]}${u.pathname}` };
  }
  return { kind: 'error', url: v, display: host + (u.pathname === '/' ? '' : u.pathname) };
}

function renderUrl(target, ctx) {
  switch (target.kind) {
    case 'start': return { title: 'New tab', html: homePage(ctx) };
    case 'internal': return { title: `edge://${target.name}`, html: internalPage(target.name, ctx) };
    case 'search': return { title: `${target.q} - Bing`, html: bingPage('/search', { q: target.q }, ctx) };
    case 'error': return { title: "Hmmm… can't reach this page", html: errorPage(target.url) };
    default: {
      const { host, path, params } = target;
      if (host === 'bing.com') return { title: params.q ? `${params.q} - Bing` : 'Bing', html: bingPage(path, params, ctx) };
      if (host === 'wikipedia.org') {
        const slugT = (path.split('/wiki/')[1] || '').replace(/\/$/, '');
        return { title: ARTICLES[slugT] ? ARTICLES[slugT].title : 'Wikipedia', html: wikipediaPage(path) };
      }
      if (host === 'github.com') return { title: 'scope-develop · GitHub', html: githubPage() };
      if (host === 'news.orb') {
        const art = NEWS.find((n) => path.includes(n.id));
        return { title: art ? `${art.title} - Orb News` : 'Orb News', html: newsPage(path, params) };
      }
      if (host === 'youtube.com') {
        const v = path.startsWith('/watch') ? VIDEOS.find((x) => x.id === params.v) : null;
        return { title: v ? `${v.title} - YouTube` : 'YouTube', html: youtubePage(path, params) };
      }
      if (host === 'minesweeper.org') return { title: 'Play Minesweeper', html: minesweeperSite() };
      if (host === 'weather.orb') return { title: 'Weather', html: weatherSite() };
      if (host === 'store.orb') return { title: 'Store', html: storeSite() };
      if (host === 'windows.com' || host === 'microsoft.com') return { title: 'Microsoft', html: windowsSite() };
      return { title: SITES[host]?.name || host, html: homePage(ctx) };
    }
  }
}

/* ------------------------------------------------------------------ launch */

export function launch(args = {}) {
  const win = createWindow({
    title: 'New tab - Microsoft Edge',
    icon: 'edge',
    width: 1080,
    height: 720,
    minWidth: 420,
    minHeight: 360,
    appId: 'edge',
    instanceKey: 'edge',
  });

  if (!state.browser || typeof state.browser !== 'object') state.browser = { favs: [], history: [] };
  if (!Array.isArray(state.browser.favs)) state.browser.favs = [];
  const session = [];

  const ctx = { history: session };

  let tabs = [];
  let active = 0;
  let seq = 1;

  win.body.innerHTML = `
    <div class="edge">
      <div class="edge-tabs" id="edge-tabs"></div>
      <div class="edge-nav">
        <button class="tb-icon" id="e-back" title="Back (Alt+←)">${icon('back')}</button>
        <button class="tb-icon" id="e-fwd" title="Forward (Alt+→)">${icon('forward')}</button>
        <button class="tb-icon" id="e-reload" title="Refresh">${icon('refresh')}</button>
        <div class="edge-addr">${icon('globe')}<input id="e-addr" spellcheck="false" autocomplete="off" placeholder="Search or enter web address"></div>
        <button class="tb-icon" id="e-star" title="Add to favourites">${icon('star')}</button>
        <button class="tb-icon" id="e-fav" title="Favourites (edge://favorites)">${icon('pin')}</button>
        <button class="tb-icon" id="e-hist" title="History (edge://history)">${icon('clock')}</button>
        <button class="tb-icon" id="e-dl" title="Downloads">${icon('download2')}</button>
        <button class="tb-icon" id="e-set" title="Edge settings">${icon('settings2')}</button>
      </div>
      <div class="edge-loadbar" id="e-bar"><i></i></div>
      <div class="edge-view" id="e-view"></div>
    </div>`;

  const tabsEl = win.body.querySelector('#edge-tabs');
  const view = win.body.querySelector('#e-view');
  const addr = win.body.querySelector('#e-addr');
  const bar = win.body.querySelector('#e-bar');

  const tab = () => tabs[active];

  function newTab(url = 'edge://start') {
    tabs.push({ id: seq++, url, history: [url], hi: 0, title: 'New tab' });
    active = tabs.length - 1;
    render();
  }

  function navigate(raw, { push = true, focus = false } = {}) {
    const t = tab();
    if (!t) return;
    const base = parseUrl(t.url);
    const target = parseUrl(raw, base.kind === 'site' ? base : null);
    if (push) {
      t.history = t.history.slice(0, t.hi + 1);
      if (t.history[t.hi] !== target.url) t.history.push(target.url);
      t.hi = t.history.length - 1;
    }
    t.url = target.url;
    if (target.kind !== 'internal') {
      session.push({ url: target.display || target.url, title: (target.kind === 'search' ? `Search: ${target.q}` : target.host || target.url) });
      if (session.length > 60) session.shift();
      state.browser.history = session.slice(-40);
      save();
    }
    loading();
    render();
    if (focus) addr.focus();
  }

  let loadTimer = null;
  function loading() {
    bar.classList.add('on');
    clearTimeout(loadTimer);
    loadTimer = setTimeout(() => bar.classList.remove('on'), 420);
  }

  function render() {
    const t = tab();
    if (!t) return;
    const target = parseUrl(t.url);
    const page = renderUrl(target, ctx);

    tabsEl.innerHTML = tabs.map((tb, i) => {
      const tp = parseUrl(tb.url);
      const title = tp.kind === 'start' ? 'New tab' : (renderUrl(tp, ctx).title || 'Page');
      tb.title = title;
      return `<button class="edge-tab${i === active ? ' active' : ''}" data-tab="${i}">
        <span class="fav" style="width:14px;height:14px;display:inline-flex">${icon(tp.kind === 'site' ? 'globe' : 'edge')}</span>
        <span class="t">${esc(title)}</span>
        <span class="x" data-close="${i}" title="Close tab">✕</span>
      </button>`;
    }).join('') + `<button class="edge-new" id="e-newtab" title="New tab (Ctrl+T)">+</button>`;

    tabsEl.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', (e) => {
      const closeEl = e.target.closest ? e.target.closest('[data-close]') : null;
      if (closeEl) {
        e.stopPropagation();
        if (tabs.length === 1) { render(); return; }
        const i = +closeEl.dataset.close;
        tabs.splice(i, 1);
        active = Math.max(0, Math.min(active, tabs.length - 1));
        render();
        return;
      }
      active = +b.dataset.tab;
      render();
    }));
    tabsEl.querySelector('#e-newtab').addEventListener('click', () => newTab());

    win.setTitle(`${page.title} - Microsoft Edge`);
    addr.value = target.display || '';
    view.innerHTML = page.html;
    view.scrollTop = 0;

    /* links, buttons and search boxes inside the page */
    view.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(b.dataset.goto);
    }));
    view.querySelectorAll('[data-open-app]').forEach((b) => b.addEventListener('click', () => openApp(b.dataset.openApp)));

    const q = view.querySelector('#edge-home-q');
    const go = () => { if (q && q.value.trim()) navigate('https://bing.com/search?q=' + encodeURIComponent(q.value.trim())); };
    q?.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    view.querySelector('#edge-home-go')?.addEventListener('click', go);
    if (q && target.kind === 'start') setTimeout(() => q.focus(), 40);

    view.querySelectorAll('[data-action]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.action === 'clear-favs') { state.browser.favs = []; save(); notify({ title: 'Edge', body: 'Favourites cleared.', icon: 'edge', timeout: 2400 }); }
      if (b.dataset.action === 'clear-history') { session.length = 0; state.browser.history = []; save(); notify({ title: 'Edge', body: 'History cleared.', icon: 'edge', timeout: 2400 }); }
      render();
    }));

    /* toolbar state */
    const back = win.body.querySelector('#e-back');
    const fwd = win.body.querySelector('#e-fwd');
    back.disabled = t.hi <= 0;
    fwd.disabled = t.hi >= t.history.length - 1;
    back.style.opacity = back.disabled ? '.35' : '1';
    fwd.style.opacity = fwd.disabled ? '.35' : '1';

    const starred = state.browser.favs.some((f) => f.url === t.url);
    const star = win.body.querySelector('#e-star');
    star.style.color = starred ? '#f2b705' : '';
    star.title = starred ? 'Remove from favourites' : 'Add to favourites';

    bus.emit('edge:rendered');
  }

  /* address bar */
  addr.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { navigate(addr.value); addr.blur(); }
    if (e.key === 'Escape') { addr.value = parseUrl(tab().url).display || ''; addr.blur(); }
  });

  win.body.querySelector('#e-back').addEventListener('click', () => {
    const t = tab();
    if (t.hi > 0) { t.hi--; t.url = t.history[t.hi]; loading(); render(); }
  });
  win.body.querySelector('#e-fwd').addEventListener('click', () => {
    const t = tab();
    if (t.hi < t.history.length - 1) { t.hi++; t.url = t.history[t.hi]; loading(); render(); }
  });
  win.body.querySelector('#e-reload').addEventListener('click', () => {
    loading();
    view.style.transition = 'opacity .12s';
    view.style.opacity = '.4';
    setTimeout(() => { render(); view.style.opacity = '1'; }, 170);
  });

  win.body.querySelector('#e-star').addEventListener('click', () => {
    const t = tab();
    const i = state.browser.favs.findIndex((f) => f.url === t.url);
    if (i >= 0) {
      state.browser.favs.splice(i, 1);
      notify({ title: 'Edge', body: 'Removed from favourites.', icon: 'star', timeout: 2200 });
    } else {
      const title = parseUrl(t.url).kind === 'start' ? 'New tab' : (renderUrl(parseUrl(t.url), ctx).title || t.url);
      state.browser.favs.unshift({ url: t.url, title });
      notify({ title: 'Edge', body: `“${title}” added to favourites.`, icon: 'star', timeout: 2600 });
    }
    save();
    render();
  });
  win.body.querySelector('#e-fav').addEventListener('click', () => navigate('edge://favorites'));
  win.body.querySelector('#e-hist').addEventListener('click', () => navigate('edge://history'));
  win.body.querySelector('#e-dl').addEventListener('click', () => navigate('edge://downloads'));
  win.body.querySelector('#e-set').addEventListener('click', () => navigate('edge://settings'));

  /* shortcuts while the browser has focus */
  win.body.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '');
    if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); addr.focus(); addr.select(); return; }
    if (e.ctrlKey && e.key.toLowerCase() === 't') { e.preventDefault(); newTab(); return; }
    if (e.ctrlKey && e.key.toLowerCase() === 'w') { e.preventDefault(); if (tabs.length > 1) { tabs.splice(active, 1); active = Math.max(0, active - 1); render(); } return; }
    if (e.ctrlKey && e.key.toLowerCase() === 'r') { e.preventDefault(); loading(); render(); return; }
    if (typing) return;
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); win.body.querySelector('#e-back').click(); }
    if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); win.body.querySelector('#e-fwd').click(); }
  });

  newTab(args.query ? 'https://bing.com/search?q=' + encodeURIComponent(args.query) : (args.url || 'edge://start'));
  win.body.tabIndex = 0;

  return win;
}
