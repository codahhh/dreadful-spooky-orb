/* ============================================================
   File Explorer
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc, fmtBytes, fmtDate, typeLabel, fileIconName, showDialog, promptDialog, bus } from '../utils.js';
import {
  state, list, getNode, mkdir, remove, rename, read, parentPath, baseName, splitPath, normPath, save, createFile,
} from '../store.js';
import { openFile } from '../fileopen.js';
import { openMenu } from '../contextmenu.js';
import { notify } from '../notify.js';
import { openApp } from '../launcher.js';

export const meta = { id: 'explorer', name: 'File Explorer', icon: 'folder' };

let current = null;

const HOME = 'C:\\Users\\Alex';
const QUICK = [
  { label: 'Desktop', path: HOME + '\\Desktop', icon: 'desktop' },
  { label: 'Downloads', path: HOME + '\\Downloads', icon: 'download' },
  { label: 'Documents', path: HOME + '\\Documents', icon: 'documents' },
  { label: 'Pictures', path: HOME + '\\Pictures', icon: 'pictures' },
  { label: 'Music', path: HOME + '\\Music', icon: 'music' },
  { label: 'Videos', path: HOME + '\\Videos', icon: 'videos' },
];

export function launch(args = {}) {
  if (current && !current.win.closed && !args.newInstance) {
    if (args.path != null) current.api.navigate(args.path, args.select);
    current.win.restore();
    current.win.focus();
    return current.win;
  }
  return openExplorer(args);
}

function openExplorer(args) {
  const win = createWindow({
    title: 'File Explorer',
    icon: 'folder',
    width: 1040,
    height: 660,
    minWidth: 620,
    minHeight: 380,
    appId: 'explorer',
    onClose: () => { if (current?.win === win) current = null; },
  });

  win.body.innerHTML = `
    <div class="exp">
      <div class="exp-nav">
        <button class="tb-icon" data-act="back" title="Back">${icon('back')}</button>
        <button class="tb-icon" data-act="forward" title="Forward">${icon('forward')}</button>
        <button class="tb-icon" data-act="up" title="Up">${icon('up')}</button>
        <button class="tb-icon" data-act="refresh" title="Refresh">${icon('refresh')}</button>
        <div class="exp-addr" id="addr"></div>
        <div class="exp-search">${icon('search')}<input placeholder="Search" spellcheck="false"></div>
        <button class="tb-icon" data-act="view" title="Switch view">${icon('view')}</button>
      </div>
      <div class="exp-body">
        <div class="exp-side" id="side"></div>
        <div class="exp-main">
          <div class="exp-cols"><span class="c-name">Name</span><span class="c-date">Date modified</span><span class="c-type">Type</span><span class="c-size">Size</span></div>
          <div class="exp-files" id="files" tabindex="0"></div>
        </div>
      </div>
      <div class="app-statusbar"><span id="st-items">0 items</span><span id="st-sel" style="margin-left:auto"></span></div>
    </div>`;

  const api = {
    win,
    path: args.path != null ? normPath(args.path) : HOME,
    history: [],
    hIndex: -1,
    view: 'details',
    selected: new Set(),
    filter: '',
    navigate(path, select) {
      const p = normPath(path);
      if (getNode(p) == null) {
        notify({ title: 'File Explorer', body: `Windows cannot find "${path}".`, icon: 'folder' });
        return;
      }
      this.path = p;
      this.selected = new Set(select ? [select] : []);
      this.filter = '';
      const search = win.body.querySelector('.exp-search input');
      if (search) search.value = '';
      this.render();
    },
    render() { render(); },
  };

  const $ = (sel) => win.body.querySelector(sel);
  const filesEl = () => win.body.querySelector('#files');

  function pushHistory(p) {
    api.history = api.history.slice(0, api.hIndex + 1);
    if (api.history[api.history.length - 1] !== p) api.history.push(p);
    api.hIndex = api.history.length - 1;
  }
  pushHistory(api.path);

  function go(p, select) {
    const np = normPath(p);
    if (getNode(np) == null) {
      notify({ title: 'File Explorer', body: `This location is not available: ${p}`, icon: 'folder' });
      return;
    }
    api.path = np;
    api.selected = new Set(select ? [select] : []);
    api.filter = '';
    win.body.querySelector('.exp-search input').value = '';
    pushHistory(np);
    render();
  }

  function currentTitle() {
    if (!api.path) return 'This PC';
    if (/^[A-Za-z]:$/.test(api.path)) {
      const n = getNode(api.path);
      return n ? n.name : api.path;
    }
    return baseName(api.path);
  }

  function render() {
    win.setTitle(currentTitle() + ' — File Explorer');
    win.body.querySelector('.exp-files').dataset.view = api.view;

    // sidebar
    const side = win.body.querySelector('#side');
    const drives = (state.fs.children || []).map((d) => ({ name: d.name, letter: d.letter, path: d.letter }));
    side.innerHTML = `
      <div class="side-head">Quick access</div>
      ${QUICK.map((q) => `<div class="side-item" data-path="${esc(q.path)}"><span style="width:16px;height:16px;display:inline-flex">${icon(q.icon)}</span>${q.label}</div>`).join('')}
      <div class="side-head">This PC</div>
      ${drives.map((d) => `<div class="side-item" data-path="${esc(d.path)}"><span style="width:16px;height:16px;display:inline-flex">${icon('disk')}</span>${esc(d.name)}</div>`).join('')}
      <div class="side-head">Other</div>
      <div class="side-item" data-path="C:\\Users\\Alex\\AppData"><span style="width:16px;height:16px;display:inline-flex">${icon('onedrive')}</span>OneDrive</div>
      <div class="side-item" data-net="1"><span style="width:16px;height:16px;display:inline-flex">${icon('globe')}</span>Network</div>
      <div class="side-item" data-bin="1"><span style="width:16px;height:16px;display:inline-flex">${icon('recycle')}</span>Recycle Bin</div>`;
    side.querySelectorAll('[data-path]').forEach((n) => {
      n.classList.toggle('active', normPath(n.dataset.path).toLowerCase() === (api.path || '').toLowerCase());
      n.addEventListener('click', () => go(n.dataset.path));
    });
    side.querySelector('[data-net]').addEventListener('click', () => notify({ title: 'Network', body: 'No other devices found on this network.', icon: 'globe' }));
    side.querySelector('[data-bin]').addEventListener('click', () => openApp('recycle'));

    // breadcrumbs
    const addr = win.body.querySelector('#addr');
    const parts = splitPath(api.path || '');
    let crumbs = `<button class="tb-icon" data-act="pc" title="This PC" style="width:22px;height:22px;margin-right:2px">${icon('thispc')}</button>`;
    if (!parts.length) crumbs += `<span class="crumb">This PC</span>`;
    parts.forEach((p, i) => {
      const node = getNode(p);
      const label = /^[A-Za-z]:$/.test(p) ? (node?.name || p) : baseName(p);
      crumbs += `<span class="cue">${i > 0 ? '<span class="sep">›</span>' : '<span class="sep">›</span>'}</span>
        <span class="crumb" data-p="${esc(p)}">${esc(label)}</span>`;
    });
    addr.innerHTML = crumbs;
    addr.querySelectorAll('.crumb[data-p]').forEach((c) => c.addEventListener('click', () => go(c.dataset.p)));
    addr.querySelector('[data-act=pc]').addEventListener('click', () => go(''));
    addr.addEventListener('dblclick', (e) => {
      if (e.target.closest('.crumb')) return;
      editAddress();
    });
    addr.title = api.path || 'This PC';

    renderFiles();
  }

  function editAddress() {
    const addr = win.body.querySelector('#addr');
    addr.innerHTML = `<input style="flex:1;border:0;outline:none;background:transparent;font-size:12px;height:26px;color:inherit" value="${esc(api.path || '')}" spellcheck="false">`;
    const input = addr.querySelector('input');
    input.focus(); input.select();
    const finish = (commit) => {
      if (commit && input.value.trim()) go(input.value.trim());
      else render();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
  }

  function items() {
    let list_ = list(api.path);
    const sortMode = SORT.mode;
    if (sortMode !== 'name') {
      list_.sort((a, b) => {
        if ((a.type === 'file') !== (b.type === 'file')) return a.type === 'file' ? 1 : -1;
        if (sortMode === 'date') return (b.modified || 0) - (a.modified || 0);
        if (sortMode === 'type') return String(typeLabel(a.name)).localeCompare(String(typeLabel(b.name)));
        if (sortMode === 'size') return String(b.content || '').length - String(a.content || '').length;
        return 0;
      });
    }
    if (api.filter) {
      const q = api.filter.toLowerCase();
      const matches = [];
      const walk = (p) => {
        list(p).forEach((it) => {
          if (it.name.toLowerCase().includes(q)) matches.push(it);
          if (it.type === 'folder') walk(it.path);
        });
      };
      walk(api.path);
      list_ = matches;
    }
    return list_;
  }

  function renderFiles() {
    const host = filesEl();
    const all = items();
    host.className = 'exp-files';
    if (api.view === 'icons') {
      host.innerHTML = all.length ? `<div class="exp-grid">${all.map((it) => tile(it)).join('')}</div>` : emptyHtml();
      host.querySelectorAll('.exp-tile').forEach((t) => bindRow(t, all.find((x) => x.path === t.dataset.path)));
    } else {
      host.innerHTML = all.length ? all.map((it) => row(it)).join('') : emptyHtml();
      host.querySelectorAll('.exp-row').forEach((r) => bindRow(r, all.find((x) => x.path === r.dataset.path)));
    }

    // selection
    const applySelection = () => {
      host.querySelectorAll('[data-path]').forEach((n) => n.classList.toggle('selected', api.selected.has(n.dataset.path)));
    };
    applySelection();

    host.oncontextmenu = (e) => {
      if (e.target.closest('[data-path]')) return;
      e.preventDefault();
      openMenu(e.clientX, e.clientY, [
        { label: 'View', icon: 'view', submenu: [
          { label: 'Large icons', checked: api.view === 'icons', action: () => { api.view = 'icons'; renderFiles(); } },
          { label: 'Details', checked: api.view === 'details', action: () => { api.view = 'details'; renderFiles(); } },
        ] },
        { label: 'Sort by', icon: 'sort', submenu: [
          { label: 'Name', action: () => sortBy('name') },
          { label: 'Date modified', action: () => sortBy('date') },
          { label: 'Type', action: () => sortBy('type') },
          { label: 'Size', action: () => sortBy('size') },
        ] },
        { label: 'Refresh', icon: 'refresh', action: render },
        'sep',
        { label: 'New', icon: 'newfolder', submenu: [
          { label: 'Folder', icon: 'newfolder', action: newFolder },
          { label: 'Text Document', icon: 'newfile', action: () => { createNewText(); } },
        ] },
        'sep',
        { label: 'Properties', icon: 'properties', action: () => folderProperties() },
      ]);
    };

    // status bar
    win.body.querySelector('#st-items').textContent = `${all.length} item${all.length === 1 ? '' : 's'}`;
    const selInfo = win.body.querySelector('#st-sel');
    const selPath = [...api.selected][0];
    const selItem = all.find((i) => i.path === selPath);
    if (selItem) {
      selInfo.textContent = selItem.type === 'file'
        ? `${selItem.name} · ${typeLabel(selItem.name)} · ${fmtBytes(String(selItem.content || '').length)}`
        : `${selItem.name} · File folder`;
    } else selInfo.textContent = '';
  }

  function sortBy(mode) {
    SORT.mode = mode;
    SORT.dir *= -1;
    renderFiles();
  }

  function emptyHtml() {
    if (api.filter) return `<div class="exp-empty">${icon('search')}<div>No items match your search.</div></div>`;
    return `<div class="exp-empty">${icon('folderOpen')}<div>This folder is empty.</div></div>`;
  }

  function row(it) {
    const isFolder = it.type !== 'file';
    const size = isFolder ? '' : fmtBytes(String(it.content || '').length);
    return `<div class="exp-row" data-path="${esc(it.path)}">
      <span style="display:inline-flex;width:17px;height:17px">${icon(isFolder ? (it.type === 'drive' ? 'disk' : 'folder') : fileIconName(it.name))}</span>
      <span class="n">${esc(it.name)}</span>
      <span class="date">${fmtDate(it.modified)}</span>
      <span class="type">${isFolder ? (it.type === 'drive' ? 'Local Disk' : 'File folder') : typeLabel(it.name)}</span>
      <span class="size">${size}</span>
    </div>`;
  }

  function tile(it) {
    const isFolder = it.type !== 'file';
    return `<div class="exp-tile" data-path="${esc(it.path)}">
      <span style="display:inline-flex;width:38px;height:38px">${icon(isFolder ? (it.type === 'drive' ? 'disk' : 'folder') : fileIconName(it.name))}</span>
      <span class="n">${esc(it.name)}</span>
    </div>`;
  }

  function bindRow(node, it) {
    if (!it) return;
    node.addEventListener('click', (e) => {
      if (e.ctrlKey) {
        if (api.selected.has(it.path)) api.selected.delete(it.path); else api.selected.add(it.path);
      } else {
        api.selected = new Set([it.path]);
      }
      win.body.querySelectorAll('[data-path]').forEach((n) => {
        if (n.closest('.exp-side')) return;
        n.classList.toggle('selected', api.selected.has(n.dataset.path));
      });
      renderFiles();
    });
    node.addEventListener('dblclick', (e) => { e.stopPropagation(); openItem(it); });
    node.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!api.selected.has(it.path)) { api.selected = new Set([it.path]); renderFiles(); }
      const isFolder = it.type !== 'file';
      const targets = [...api.selected];
      openMenu(e.clientX, e.clientY, [
        { label: 'Open', icon: 'open', action: () => openItem(it) },
        isFolder ? { label: 'Open in new window', icon: 'newfile', action: () => openApp('explorer', { path: it.path, newInstance: true }) } : null,
        !isFolder ? { label: 'Open with Notepad', icon: 'notepad', action: () => openApp('notepad', { path: it.path }) } : null,
        'sep',
        { label: 'Copy path', icon: 'copy', action: () => { navigator.clipboard?.writeText(it.path).catch(() => {}); notify({ title: 'Copied', body: it.path, icon: 'copy', timeout: 2600 }); } },
        { label: 'Rename', icon: 'rename', shortcut: 'F2', action: () => renameItem(it) },
        { label: 'Delete', icon: 'trash', shortcut: 'Del', action: () => deleteItems(targets) },
        'sep',
        { label: 'Properties', icon: 'properties', action: () => properties(it) },
      ].filter(Boolean));
    });
  }

  function openItem(it) {
    if (it.type === 'folder' || it.type === 'drive') go(it.path);
    else openFile(it.path);
    api.selected = new Set();
  }

  async function renameItem(it) {
    const n = await promptDialog('Rename', it.name, 'Enter a new name:');
    if (!n || n === it.name) return;
    if (!rename(it.path, n)) notify({ title: 'Rename', body: 'A file or folder with that name already exists.', icon: 'warning' });
    api.selected = new Set([parentPath(it.path) ? parentPath(it.path) + '\\' + n : n]);
    render();
  }

  function deleteItems(paths) {
    const n = paths.length;
    paths.forEach((p) => remove(p));
    api.selected = new Set();
    render();
    bus.emit('recycle:changed');
    notify({ title: 'File Explorer', body: n > 1 ? `${n} items moved to the Recycle Bin.` : 'Moved to the Recycle Bin.', icon: 'recycle' });
  }

  function properties(it) {
    const isFolder = it.type !== 'file';
    const kids = isFolder ? (getNode(it.path)?.children || []).length : 0;
    showDialog({
      title: `${esc(it.name)} Properties`,
      body: `<div class="set-kv">
        <dt>Type</dt><dd>${isFolder ? 'File folder' : typeLabel(it.name)}</dd>
        <dt>Location</dt><dd>${esc(parentPath(it.path) || 'This PC')}</dd>
        <dt>Size</dt><dd>${isFolder ? `${kids} items` : fmtBytes(String(it.content || '').length)}</dd>
        ${isFolder ? `<dt>Contains</dt><dd>${kids} items</dd>` : ''}
        <dt>Created</dt><dd>${fmtDate(it.created || it.modified)}</dd>
        <dt>Modified</dt><dd>${fmtDate(it.modified)}</dd>
        <dt>Attributes</dt><dd>${isFolder ? 'Directory' : 'Archive'}</dd>
      </div>`,
      buttons: [{ id: 'ok', label: 'OK', primary: true }],
      width: 460,
    });
  }

  function folderProperties() {
    properties({ name: currentTitle(), type: /^[A-Za-z]:$/.test(api.path) ? 'drive' : 'folder', path: api.path, modified: Date.now(), created: Date.now() });
  }

  function newFolder() {
    const p = mkdir(api.path, 'New folder');
    if (!p) { notify({ title: 'File Explorer', body: 'Cannot create a folder here.', icon: 'warning' }); return; }
    api.selected = new Set([p]);
    render();
    setTimeout(() => renameItem({ path: p, name: 'New folder' }), 60);
  }

  function createNewText() {
    const p = createFile(api.path, 'New Text Document.txt', '');
    render();
    if (p) openApp('notepad', { path: p });
  }

  // toolbar
  win.body.querySelectorAll('.exp-nav [data-act]').forEach((b) => {
    b.addEventListener('click', () => {
      switch (b.dataset.act) {
        case 'back': if (api.hIndex > 0) { api.hIndex--; api.path = api.history[api.hIndex]; api.selected = new Set(); api.filter = ''; render(); } break;
        case 'forward': if (api.hIndex < api.history.length - 1) { api.hIndex++; api.path = api.history[api.hIndex]; api.selected = new Set(); api.filter = ''; render(); } break;
        case 'up': go(parentPath(api.path) || ''); break;
        case 'refresh': render(); break;
        case 'view': api.view = api.view === 'details' ? 'icons' : 'details'; renderFiles(); break;
      }
    });
  });

  win.body.querySelector('.exp-search input').addEventListener('input', (e) => {
    api.filter = e.target.value;
    renderFiles();
  });

  filesEl().addEventListener('keydown', (e) => {
    if (!api.selected.size) return;
    const p = [...api.selected][0];
    const it = list(parentPath(p)).find((x) => x.path === p) || { path: p, name: baseName(p), type: 'file' };
    if (e.key === 'Delete') { e.preventDefault(); deleteItems([...api.selected]); }
    if (e.key === 'F2') { e.preventDefault(); renameItem(it); }
    if (e.key === 'Enter') { e.preventDefault(); openItem(it); }
    if (e.key === 'Backspace') { e.preventDefault(); go(parentPath(api.path) || ''); }
  });

  win.body.querySelector('#files').addEventListener('click', (e) => {
    if (e.target.closest('[data-path]')) return;
    api.selected = new Set();
    renderFiles();
  });

  current = { win, api };
  api.render = render;
  render();
  if (args.select) {
    api.selected = new Set([normPath(api.path) + '\\' + args.select]);
  }
  return win;
}

const SORT = { mode: 'name', dir: 1 };
