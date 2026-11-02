/* ============================================================
   Store: settings + virtual file system, persisted to localStorage
   ============================================================ */

import { debounce, fileKind } from './utils.js';

const KEY = 'win10os.state.v1';

/* ------------------------------ sample images ------------------------------ */
function svgPic(a, b, c, motif) {
  const arts = {
    hills: `<circle cx="560" cy="150" r="70" fill="#ffd98a" opacity=".95"/>
      <path d="M0 470 L210 250 L330 370 L470 210 L700 470 Z" fill="${b}"/>
      <path d="M0 500 L180 330 L300 440 L430 320 L700 500 Z" fill="${c}" opacity=".85"/>
      <path d="M0 520 L700 520 L700 500 L0 500 Z" fill="#101820" opacity=".25"/>`,
    waves: `<g fill="none" stroke="${b}" stroke-width="26" opacity=".55">
      <path d="M-20 300 C 120 180, 260 420, 400 300 S 620 180, 740 300"/>
      <path d="M-20 370 C 140 250, 280 480, 420 370 S 640 260, 740 370"/>
      <path d="M-20 440 C 160 330, 300 540, 440 440 S 660 340, 740 440"/></g>
      <circle cx="520" cy="150" r="90" fill="${c}" opacity=".5"/>`,
    orb: `<circle cx="350" cy="270" r="150" fill="${b}" opacity=".85"/>
      <circle cx="350" cy="270" r="150" fill="none" stroke="${c}" stroke-width="3" opacity=".9"/>
      <circle cx="350" cy="270" r="205" fill="none" stroke="${c}" stroke-width="1.4" opacity=".5"/>
      <circle cx="120" cy="120" r="4" fill="#fff" opacity=".8"/><circle cx="590" cy="380" r="3" fill="#fff" opacity=".7"/>
      <circle cx="470" cy="110" r="2" fill="#fff" opacity=".6"/><circle cx="210" cy="420" r="2.4" fill="#fff" opacity=".7"/>`,
    city: `<g fill="${b}" opacity=".9">
        <rect x="60" y="250" width="70" height="270"/><rect x="145" y="180" width="54" height="340"/>
        <rect x="212" y="300" width="86" height="220"/><rect x="312" y="140" width="62" height="380"/>
        <rect x="388" y="250" width="78" height="270"/><rect x="480" y="210" width="60" height="310"/>
        <rect x="552" y="290" width="96" height="230"/></g>
      <g fill="#ffe9a8" opacity=".85">${Array.from({length: 46}, (_, i) => { const x = 72 + (i % 12) * 52 + (i % 3) * 6; const y = 200 + Math.floor(i / 12) * 58; return `<rect x="${x}" y="${y}" width="7" height="9"/>`; }).join('')}</g>
      <circle cx="600" cy="90" r="42" fill="#fff" opacity=".8"/>`,
    forest: `<rect y="360" width="700" height="160" fill="${c}" opacity=".7"/>
      <g fill="${b}">${Array.from({length: 9}, (_, i) => { const x = 40 + i * 80, h = 180 + (i % 3) * 60; return `<path d="M${x} 380 L${x + 44} ${380 - h} L${x + 88} 380 Z"/>`; }).join('')}</g>
      <path d="M0 400 Q350 320 700 400 L700 520 L0 520 Z" fill="#0f1a14" opacity=".55"/>`,
    desert: `<circle cx="520" cy="180" r="82" fill="#ffd08a" opacity=".95"/>
      <path d="M0 420 Q180 300 380 400 Q530 470 700 360 L700 520 L0 520 Z" fill="${b}"/>
      <path d="M0 470 Q200 380 420 470 Q560 520 700 450 L700 520 L0 520 Z" fill="${c}" opacity=".75"/>`,
    night: `<circle cx="560" cy="120" r="58" fill="#f2f6ff" opacity=".9"/>
      <circle cx="536" cy="104" r="52" fill="${a}" opacity=".9"/>
      <g fill="#fff">${Array.from({length: 60}, (_, i) => { const x = (i * 137) % 690 + 5, y = (i * 91) % 470 + 12, r = (i % 4) * 0.6 + 0.8; return `<circle cx="${x}" cy="${y}" r="${r}" opacity="${0.35 + (i % 5) * 0.12}"/>`; }).join('')}</g>
      <path d="M0 430 L150 350 L300 420 L470 330 L700 430 L700 520 L0 520 Z" fill="${b}"/>`,
    peaks: `<path d="M0 420 L170 120 L300 300 L400 200 L470 300 L560 140 L700 420 Z" fill="${b}"/>
      <path d="M170 120 L210 190 L130 190 Z" fill="#fff" opacity=".9"/>
      <path d="M560 140 L600 205 L520 205 Z" fill="#fff" opacity=".85"/>
      <rect x="0" y="410" width="700" height="110" fill="${c}" opacity=".55"/>`,
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="520" viewBox="0 0 700 520">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs>
    <rect width="700" height="520" fill="url(#g)"/>
    ${arts[motif] || ''}
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const SAMPLE_PICS = [
  { name: 'Sample - Sunset.jpg', src: svgPic('#2b1055', '#7f5af0', '#ff9e64', 'hills'), album: 'Wallpapers' },
  { name: 'Sample - Waves.jpg', src: svgPic('#031b2e', '#2e9fd6', '#04141f', 'waves'), album: 'Ocean' },
  { name: 'Sample - Orb.jpg', src: svgPic('#08061a', '#7b47ff', '#12f7d6', 'orb'), album: 'Wallpapers' },
  { name: 'Sample - Peaks.jpg', src: svgPic('#1d2b4b', '#5f7fb5', '#ffd0a1', 'peaks'), album: 'Mountains' },
  { name: 'Sample - Skyline.jpg', src: svgPic('#101b2e', '#2b3d5c', '#0a1220', 'city'), album: 'City' },
  { name: 'Sample - Forest.jpg', src: svgPic('#0d1f18', '#1f6b4a', '#0a1612', 'forest'), album: 'Nature' },
  { name: 'Sample - Desert.jpg', src: svgPic('#3a1d10', '#e08a4b', '#7a3f1d', 'desert'), album: 'Nature' },
  { name: 'Sample - Night.jpg', src: svgPic('#050a18', '#12203d', '#02040a', 'night'), album: 'City' },
];

const SAMPLE_MUSIC = [
  { name: '01 Spooky Orb (Main Theme).mp3', size: 8_412_331, album: 'Dreadful Systems' },
  { name: '02 Taskbar Dreams.mp3', size: 6_998_204, album: 'The Pinned Five' },
  { name: '03 Ctrl + Shift + Esc.mp3', size: 9_120_884, album: 'Blue Screen Choir' },
  { name: '04 Aero Snap.mp3', size: 5_884_112, album: 'Dreadful Systems' },
  { name: '05 Night Light.mp3', size: 8_221_770, album: 'Amber Hours' },
  { name: '06 Recycle Bin Waltz.mp3', size: 7_100_455, album: 'The Restored' },
];

/* ------------------------------ file system seed ------------------------------ */
function f(name, content, kind = 'text', modified = Date.now()) {
  return { name, type: 'file', content, kind: kind || fileKind(name), modified, created: modified };
}
function d(name, children = []) {
  return { name, type: 'folder', children, modified: Date.now(), created: Date.now() };
}

function seedFs() {
  const now = Date.now();
  const docs = d('Documents', [
    f('Welcome.txt', `Welcome to Windows 10.\r\n\r\nThis is a complete desktop environment that runs in your browser.\r\nEverything you see is real, working software:\r\n\r\n  * Drag, resize, snap and stack windows\r\n  * Browse the virtual file system in File Explorer\r\n  * Edit and save real files with Notepad and Paint\r\n  * Use the terminal, calculator, task manager and more\r\n\r\nKeyboard shortcuts\r\n------------------\r\n  Win                Open the Start menu\r\n  Win + E            File Explorer\r\n  Win + D            Show the desktop\r\n  Win + L            Lock the PC\r\n  Win + A            Action center\r\n  Win + Tab          Task view\r\n  Alt + Tab          Switch windows\r\n  Alt + F4           Close the active window\r\n  Win + Arrows       Snap windows\r\n  Ctrl+Shift+Esc     Task Manager\r\n\r\nHave fun.`),
    f('Read me first.txt', `Nothing here is harmful.\r\nNo data leaves your browser: the file system lives in localStorage.\r\n\r\nTo reset the whole machine to factory defaults, open Settings > Update & Security > Reset this PC.`),
    d('Projects', [
      f('ideas.txt', `Project ideas\r\n--------------\r\n1. Port Solitaire\r\n2. Add a real terminal with a shell parser\r\n3. Make the taskbar auto-hide\r\n4. Ship it`),
      f('notes.md', `# Notes\n\n- Windows 10 shell, rebuilt from scratch\n- Window manager supports snapping\n- Everything persists between reloads`),
      f('roadmap.md', `# Roadmap\n\n## 2026 Q1\n- [x] Window manager with snap layouts\n- [x] Virtual file system\n- [x] Touch support\n\n## Q2\n- [ ] Multi-desktop\n- [ ] Real audio engine\n- [ ] Themes marketplace\n- [ ] Something with the orb (again)`),
      f('poem.txt', `The orb hangs low above the taskbar,\r\nA patient light, a purple star,\r\nIt watches while the windows stack,\r\nAnd hums the fans I do not have.`),
      f('recipe.md', `# Late-night noodles\n\n- 1 pack noodles\n- 2 tbsp soy sauce\n- 1 egg\n- chilli, to taste\n\nBoil. Drain. Fry. Eat at the keyboard. Wipe the keys afterwards.`),
      f('budget.csv', 'month,income,spend\r\nJanuary,2400,1980\r\nFebruary,2400,2104\r\nMarch,2600,1875'),
      f('changelog.txt', `19045.3803\r\n- Window controls rewritten for touch\r\n- Weather now has hourly detail\r\n- Store catalogue expanded\r\n- Photos gained albums`),
    ]),
  ]);
  const pics = d('Pictures', [
    ...SAMPLE_PICS.map((p, i) => f(p.name, p.src, 'image', now - 86400000 - i * 3600000)),
    d('Screenshots', [
      f('Screenshot (1).png', SAMPLE_PICS[4].src, 'image', now - 5400000),
      f('Screenshot (2).png', SAMPLE_PICS[7].src, 'image', now - 3600000),
    ]),
    d('Wallpapers', [
      f('orb-dark.png', SAMPLE_PICS[2].src, 'image', now - 7200000),
      f('sunset-wide.png', SAMPLE_PICS[0].src, 'image', now - 7000000),
    ]),
    d('Saved pictures', [f('skyline.png', SAMPLE_PICS[4].src, 'image', now - 43200000)]),
  ]);
  const music = d('Music', [
    ...SAMPLE_MUSIC.map((t, i) => f(t.name, `audio:${t.album}`, 'audio', now - i * 86400000)),
    d('Dreadful Systems', [
      f('01 Spooky Orb (Main Theme).mp3', 'audio:Dreadful Systems', 'audio', now - 86400000),
      f('04 Aero Snap.mp3', 'audio:Dreadful Systems', 'audio', now - 86400000),
    ]),
    f('playlist.m3u', '#EXTM3U\r\n01 Spooky Orb (Main Theme).mp3\r\n02 Taskbar Dreams.mp3\r\n03 Ctrl + Shift + Esc.mp3\r\n04 Aero Snap.mp3\r\n05 Night Light.mp3\r\n06 Recycle Bin Waltz.mp3'),
  ]);
  const videos = d('Videos', [
    d('Captures', [f('clip-0001.mp4', 'video:1280x720', 'video', now - 86400000)]),
    f('orb-timelapse.mp4', 'video:1920x1080', 'video', now - 172800000),
    f('minesweeper-run.mp4', 'video:1280x720', 'video', now - 259200000),
  ]);
  const desktopFiles = d('Desktop', [
    f('todo.txt', `Today\r\n-----\r\n[x] Boot the PC\r\n[x] Open every app at once\r\n[ ] Reorganise the desktop icons\r\n[ ] Win at Minesweeper (expert)`),
    f('shortcut-notes.md', '# Desktop notes\n\nRight-click the desktop to change wallpaper, sort icons or refresh.'),
  ]);
  const dl = d('Downloads', [
    f('release-notes.txt', `Build 19045.3803\r\n\r\n* Taskbar search is faster\r\n* Fixed a bug where the Start menu would not open\r\n* Minesweeper now remembers your best time\r\n* Window buttons work on touch screens`),
    f('invoice-2024.pdf', 'Not really a PDF. Nice try.', 'other'),
    f('spec-sheet.csv', 'part,qty,price\r\nRaspberry Pi,2,45.00\r\nUSB-C hub,1,29.99\r\nOrb polish,1,9.99'),
    f('orb-wallpaper.png', SAMPLE_PICS[2].src, 'image', now - 3600000),
    f('installer-setup.exe', 'MZ... (binary)', 'other'),
  ]);
  return {
    name: 'This PC', type: 'folder', children: [
      { name: 'Local Disk (C:)', type: 'drive', letter: 'C:', children: [
        d('Users', [
          d('Alex', [
            { ...docs, modified: now },
            { ...pics, modified: now },
            desktopFiles, dl, music, videos,
            d('AppData', [d('Local', [d('Temp', [])])]),
          ]),
        ]),
        d('Windows', [
          { ...d('System32', [
            f('cmd.exe', 'MZ... (binary)', 'other'), f('notepad.exe', 'MZ... (binary)', 'other'),
            f('win.ini', '[windows]\r\nload=\r\nrun=', 'text'),
            f('drivers.txt', 'Display adapter: Dreadful Spooky Orb Graphics 620\r\nAudio: Browser Audio Device'),
          ]) },
          d('Fonts', [f('segoeui.ttf', 'font', 'other')]),
        ]),
        d('Program Files', [d('Windows NT', [d('Accessories', [])]), d('Internet Explorer', [])]),
        d('Temp', []),
      ] },
      { name: 'Local Disk (D:)', type: 'drive', letter: 'D:', children: [d('Backup', [f('backup-2024.txt', 'Nothing to see here.')])] },
    ],
  };
}

/* ------------------------------ defaults ------------------------------ */
const defaultSettings = () => ({
  userName: 'Alex',
  accent: '#0078d7',
  theme: 'light',
  wallpaper: 'hero',
  taskbarAccent: false,
  brightness: 100,
  nightLight: false,
  nightLightStrength: 30,
  taskbarPinned: ['explorer', 'edge', 'notepad', 'paint', 'settings', 'store'],
  startTiles: [
    { appId: 'weather', size: 'medium' },
    { appId: 'mail', size: 'small' },
    { appId: 'calendar', size: 'small' },
    { appId: 'store', size: 'medium' },
    { appId: 'photos', size: 'small' },
    { appId: 'media', size: 'small' },
    { appId: 'settings', size: 'small' },
    { appId: 'minesweeper', size: 'small' },
  ],
  wifi: true,
  bluetooth: true,
  airplane: false,
  nightLightQuick: false,
  focusAssist: false,
  showDesktopIcons: true,
  iconSize: 'medium',
  volume: 68,
  dockPosition: 'bottom',
});

const defaultDesktopIcons = () => [
  { id: 'bin', name: 'Recycle Bin', appId: 'recycle', icon: 'recycle' },
  { id: 'pc', name: 'This PC', appId: 'explorer', args: { path: 'C:' }, icon: 'thispc' },
  { id: 'docs', name: 'Documents', appId: 'explorer', args: { path: 'C:\\Users\\Alex\\Documents' }, icon: 'documents' },
  { id: 'edge', name: 'Microsoft Edge', appId: 'edge', icon: 'edge' },
  { id: 'notepad', name: 'Notepad', appId: 'notepad', icon: 'notepad' },
  { id: 'paint', name: 'Paint', appId: 'paint', icon: 'paint' },
  { id: 'photos', name: 'Photos', appId: 'photos', icon: 'photos' },
  { id: 'calc', name: 'Calculator', appId: 'calculator', icon: 'calculator' },
  { id: 'mine', name: 'Minesweeper', appId: 'minesweeper', icon: 'mine' },
  { id: 'welcome', name: 'Get started', appId: 'welcome', icon: 'windows' },
];

/* ------------------------------ state ------------------------------ */
const SEED_VERSION = 2;   // bumped whenever the sample content changes

function fresh() {
  return {
    seed: SEED_VERSION,
    settings: defaultSettings(),
    fs: seedFs(),
    recycle: [],
    desktopIcons: defaultDesktopIcons(),
    notifications: [],
    wallpaperCustom: null,
    installed: [],
  };
}

let state = fresh();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const saved = JSON.parse(raw);
    state = { ...fresh(), ...saved, settings: { ...defaultSettings(), ...(saved.settings || {}) } };
    // content upgrade: keep the user's settings, refresh the sample files
    if (!state.fs || (saved.seed || 1) < SEED_VERSION) {
      state.fs = seedFs();
      state.seed = SEED_VERSION;
    }
  }
} catch (e) { console.warn('state load failed', e); }

export { state };

function persistNow() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) {
    console.warn('state save failed', e);
    if (e.name === 'QuotaExceededError') {
      // too many images: drop the largest blobs and try again
      state.fs = seedFs();
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
    }
  }
}
export const save = debounce(persistNow, 300);
save.now = persistNow;

// never lose a change because the tab closed mid-debounce
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', persistNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) persistNow(); });
}

export function resetAll() {
  const keep = state.settings;
  Object.assign(state, fresh(), { settings: { ...defaultSettings(), userName: keep.userName } });
  save();
}

export function updateSettings(patch) {
  Object.assign(state.settings, patch);
  save();
  applySettings();
}

/* ------------------------------ path helpers ------------------------------ */
export function normPath(p = '') {
  if (!p) return '';
  let s = String(p).replace(/\//g, '\\').replace(/\\{2,}/g, '\\');
  s = s.replace(/\\+$/, '');
  return s;
}
export function joinPath(a, b) {
  const base = normPath(a);
  if (!base) return normPath(b);
  return normPath(base + '\\' + b);
}
export function parentPath(p) {
  const s = normPath(p);
  if (!s || /^[A-Za-z]:$/.test(s)) return s ? '' : '';
  const i = s.lastIndexOf('\\');
  if (i < 0) return '';
  const head = s.slice(0, i);
  return head;
}
export function baseName(p) {
  const s = normPath(p);
  const i = s.lastIndexOf('\\');
  return i < 0 ? s : s.slice(i + 1);
}
export function splitPath(p) {
  const s = normPath(p);
  if (!s) return [];
  const out = [];
  const parts = s.split('\\');
  out.push(parts[0]);
  for (let i = 1; i < parts.length; i++) out.push(out[i - 1] + '\\' + parts[i]);
  return out;
}

export function findRoot() { return state.fs; }

export function getNode(path) {
  const p = normPath(path);
  if (!p) return state.fs;
  const parts = p.split('\\');
  const first = parts[0].toUpperCase();
  let node = state.fs.children.find((c) => c.type === 'drive' && ((c.letter || '').toUpperCase() === first || c.name.toUpperCase().startsWith(first)));
  if (!node) return null;
  for (let i = 1; i < parts.length; i++) {
    if (!node.children) return null;
    const next = node.children.find((c) => c.name.toLowerCase() === parts[i].toLowerCase());
    if (!next) return null;
    node = next;
  }
  return node;
}

export function exists(path) { return !!getNode(path); }
export function isFolder(path) { const n = getNode(path); return !!n && (n.type === 'folder' || n.type === 'drive'); }

function nodePath(parent, node) {
  if (node.type === 'drive') return node.letter || 'C:';
  return joinPath(parent, node.name);
}

export function list(path) {
  const node = getNode(path);
  if (!node || !node.children) return [];
  return node.children
    .map((c) => ({ ...c, path: nodePath(normPath(path), c), _ref: c }))
    .sort((a, b) => {
      const af = a.type !== 'file', bf = b.type !== 'file';
      if (af !== bf) return af ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
}

export function read(path) {
  const n = getNode(path);
  if (!n || n.type !== 'file') return null;
  return n.content ?? '';
}

export function sizeOf(node) {
  if (!node) return 0;
  if (node.type === 'file') return node.content ? String(node.content).length : 0;
  return 0;
}

export function uniqueName(parent, base) {
  const kids = getNode(parent)?.children || [];
  const names = new Set(kids.map((k) => k.name.toLowerCase()));
  let candidate = base;
  let n = 2;
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '';
  while (names.has(candidate.toLowerCase())) candidate = `${stem} (${n++})${ext}`;
  return candidate;
}

export function mkdir(parent, name = 'New folder') {
  const node = getNode(parent);
  if (!node || !node.children) return null;
  const clean = uniqueName(parent, name);
  const n = { ...d(clean), created: Date.now(), modified: Date.now() };
  node.children.push(n);
  save();
  return joinPath(parent, clean);
}

export function createFile(parent, name = 'New Text Document.txt', content = '', kind) {
  const node = getNode(parent);
  if (!node || !node.children) return null;
  const clean = uniqueName(parent, name);
  node.children.push(f(clean, content, kind));
  save();
  return joinPath(parent, clean);
}

export function writeFile(path, content) {
  const n = getNode(path);
  if (!n || n.type !== 'file') return false;
  n.content = content;
  n.modified = Date.now();
  save();
  return true;
}

export function saveAs(path, content, kind) {
  const parent = parentPath(path);
  const node = getNode(parent);
  if (!node || !node.children) return false;
  const existing = node.children.find((c) => c.name.toLowerCase() === baseName(path).toLowerCase());
  if (existing) {
    existing.content = content;
    existing.kind = kind || existing.kind;
    existing.modified = Date.now();
  } else {
    node.children.push(f(baseName(path), content, kind));
  }
  save();
  return true;
}

export function rename(path, newName) {
  const node = getNode(path);
  if (!node) return false;
  if (node.type === 'drive') return false;
  const parent = getNode(parentPath(path));
  if (!parent || !parent.children) return false;
  if (parent.children.some((c) => c !== node && c.name.toLowerCase() === newName.toLowerCase())) return false;
  node.name = newName;
  node.modified = Date.now();
  save();
  return true;
}

export function remove(path) {
  const parentPath_ = parentPath(path);
  const parent = getNode(parentPath_);
  const node = getNode(path);
  if (!parent || !node || node.type === 'drive' || !parent.children) return false;
  parent.children = parent.children.filter((c) => c !== node);
  state.recycle.unshift({ node, path: normPath(path), deletedAt: Date.now() });
  save();
  return true;
}

export function restore(index) {
  const entry = state.recycle[index];
  if (!entry) return false;
  const parent = getNode(parentPath(entry.path));
  if (!parent || !parent.children) return false;
  const name = uniqueName(parentPath(entry.path), entry.node.name);
  entry.node.name = name;
  parent.children.push(entry.node);
  state.recycle.splice(index, 1);
  save();
  return true;
}

export function emptyRecycle() {
  state.recycle = [];
  save();
}

export function deleteForever(index) {
  state.recycle.splice(index, 1);
  save();
}

export function recycleSize() {
  return state.recycle.length;
}

/* ------------------------------ wallpaper / theming ------------------------------ */
export const WALLPAPERS = [
  { id: 'hero', name: 'Windows 10 (Hero)' },
  { id: 'spooky', name: 'Dreadful Orb' },
  { id: 'horizon', name: 'Horizon' },
  { id: 'mono', name: 'Dark Mono' },
  { id: 'accent', name: 'Accent Flow' },
];

export function wallpaperClass(id = state.settings.wallpaper) {
  return 'wp-' + (WALLPAPERS.some((w) => w.id === id) ? id : 'hero');
}

export function applyWallpaper() {
  if (state.wallpaperCustom) {
    document.querySelectorAll('.wp-layer').forEach((l) => {
      l.className = 'wp-layer';
      l.style.backgroundImage = `url("${state.wallpaperCustom}")`;
      l.style.backgroundSize = 'cover';
      l.style.backgroundPosition = 'center';
    });
    const lbg = document.querySelector('.lock-bg');
    if (lbg) lbg.style.backgroundImage = `url("${state.wallpaperCustom}")`;
    return;
  }
  document.querySelectorAll('.wp-layer').forEach((l) => {
    l.style.backgroundImage = '';
    l.className = 'wp-layer ' + wallpaperClass();
  });
  const lbg = document.querySelector('.lock-bg');
  if (lbg) { lbg.style.backgroundImage = ''; lbg.className = 'lock-bg ' + wallpaperClass(); }
}

export function applySettings() {
  const s = state.settings;
  document.documentElement.style.setProperty('--accent', s.accent);
  const dark = isDarkAccent(s.accent);
  document.documentElement.style.setProperty('--accent-dark', shade(s.accent, -28));
  document.documentElement.style.setProperty('--accent-2', shade(s.accent, 12));
  document.body.classList.toggle('dark', s.theme === 'dark');
  document.body.classList.toggle('light', s.theme !== 'dark');
  document.body.classList.toggle('accent-taskbar', !!s.taskbarAccent);
  applyWallpaper();

  let filter = '';
  if (s.brightness < 100) filter += `brightness(${0.45 + s.brightness / 180})`;
  const wp = document.getElementById('wallpaper');
  if (wp) wp.style.filter = filter;

  let nl = document.getElementById('nightlight-overlay');
  if (s.nightLight) {
    if (!nl) {
      nl = document.createElement('div');
      nl.id = 'nightlight-overlay';
      nl.style.cssText = 'position:absolute;inset:0;z-index:99999;pointer-events:none;mix-blend-mode:multiply;transition:opacity .3s';
      document.getElementById('screen').append(nl);
    }
    nl.style.background = `rgba(255,147,41,${0.08 + s.nightLightStrength / 200})`;
    nl.style.display = 'block';
  } else if (nl) nl.style.display = 'none';
}

function shade(hex, pct) {
  const m = String(hex).replace('#', '');
  const num = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
  let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  r = Math.max(0, Math.min(255, Math.round(r + (pct / 100) * 255)));
  g = Math.max(0, Math.min(255, Math.round(g + (pct / 100) * 255)));
  b = Math.max(0, Math.min(255, Math.round(b + (pct / 100) * 255)));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function isDarkAccent(hex) {
  const m = String(hex).replace('#', '');
  const num = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) < 90;
}

/* ------------------------------ notifications persistence ------------------------------ */
export function pushNotification(n) {
  state.notifications.unshift({ id: Math.random().toString(36).slice(2), time: Date.now(), ...n });
  state.notifications = state.notifications.slice(0, 30);
  save();
}
export function clearNotifications() { state.notifications = []; save(); }
