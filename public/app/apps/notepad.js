/* ============================================================
   Notepad
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc, showDialog, fmtDate, pad2, bus } from '../utils.js';
import { read, saveAs, writeFile, getNode, baseName, createFile, parentPath } from '../store.js';
import { fileDialog } from '../filedialog.js';
import { openMenu } from '../contextmenu.js';
import { notify } from '../notify.js';

export const meta = { id: 'notepad', name: 'Notepad', icon: 'notepad' };

export function launch(args = {}) {
  const win = createWindow({
    title: 'Untitled - Notepad',
    icon: 'notepad',
    width: 820,
    height: 580,
    minWidth: 380,
    minHeight: 240,
    appId: 'notepad',
  });

  let filePath = args.path && getNode(args.path)?.type === 'file' ? args.path : null;
  let dirty = false;
  let wrap = true;

  win.body.innerHTML = `
    <div class="np">
      <div class="app-menubar">
        <button data-menu="file">File</button>
        <button data-menu="edit">Edit</button>
        <button data-menu="format">Format</button>
        <button data-menu="view">View</button>
        <button data-menu="help">Help</button>
      </div>
      <textarea spellcheck="false" class="wrap"></textarea>
      <div class="app-statusbar">
        <span class="np-pos">Ln 1, Col 1</span>
        <span style="margin-left:auto" class="np-stat">100%</span>
        <span>Windows (CRLF)</span>
        <span>UTF-8</span>
      </div>
    </div>`;
  const ta = win.body.querySelector('textarea');
  const pos = win.body.querySelector('.np-pos');

  function setDirty(v) {
    dirty = v;
    win.setTitle(`${dirty ? '*' : ''}${filePath ? baseName(filePath) : 'Untitled'} - Notepad`);
  }

  function load(path) {
    const content = read(path);
    if (content == null) { notify({ title: 'Notepad', body: `Cannot open ${path}`, icon: 'notepad' }); return; }
    filePath = path;
    ta.value = content.replace(/\r\n/g, '\n');
    setDirty(false);
    updatePos();
  }

  function updatePos() {
    const idx = ta.selectionStart;
    const before = ta.value.slice(0, idx);
    const line = before.split('\n').length;
    const col = idx - before.lastIndexOf('\n');
    pos.textContent = `Ln ${line}, Col ${col}`;
  }

  function newFile() {
    if (dirty) return confirmDiscard(() => { ta.value = ''; filePath = null; setDirty(false); });
    ta.value = ''; filePath = null; setDirty(false);
  }

  async function openFile() {
    const p = await fileDialog({ mode: 'open', title: 'Open', initialPath: 'C:\\Users\\Alex\\Documents' });
    if (p) load(p);
  }

  async function save() {
    if (filePath) {
      writeFile(filePath, ta.value.replace(/\n/g, '\r\n'));
      setDirty(false);
      notify({ title: 'Notepad', body: `Saved ${baseName(filePath)}`, icon: 'notepad', timeout: 2200 });
      return true;
    }
    return saveAsFile();
  }

  async function saveAsFile() {
    const p = await fileDialog({ mode: 'save', title: 'Save As', initialPath: parentPath(filePath || '') || 'C:\\Users\\Alex\\Documents', initialName: filePath ? baseName(filePath) : 'Untitled.txt', ext: 'txt' });
    if (!p) return false;
    saveAs(p, ta.value, 'text');
    filePath = p;
    setDirty(false);
    notify({ title: 'Notepad', body: `Saved ${baseName(p)}`, icon: 'notepad', timeout: 2200 });
    return true;
  }

  function confirmDiscard(then) {
    showDialog({
      title: 'Notepad',
      body: `Do you want to save changes to ${filePath ? baseName(filePath) : 'Untitled'}?`,
      buttons: [{ id: 'cancel', label: 'Cancel' }, { id: 'no', label: "Don't save" }, { id: 'yes', label: 'Save', primary: true }],
    }).then(async (r) => {
      if (r === 'yes') { const ok = await save(); if (ok) then(); }
      else if (r === 'no') then();
    });
  }

  const menus = {
    file: () => [
      { label: 'New', icon: 'newfile', shortcut: 'Ctrl+N', action: newFile },
      { label: 'New window', icon: 'newfolder', shortcut: 'Ctrl+Shift+N', action: () => launch({}) },
      { label: 'Open…', icon: 'open', shortcut: 'Ctrl+O', action: openFile },
      { label: 'Save', icon: 'save', shortcut: 'Ctrl+S', action: () => save() },
      { label: 'Save as…', icon: 'save', shortcut: 'Ctrl+Shift+S', action: saveAsFile },
      'sep',
      { label: 'Page setup…', icon: 'properties', action: () => notify({ title: 'Notepad', body: 'Page setup is not available in this build.', icon: 'notepad' }) },
      { label: 'Print…', icon: 'printer', shortcut: 'Ctrl+P', action: () => notify({ title: 'Notepad', body: 'No printer is installed. Try Print to PDF from Settings.', icon: 'notepad' }) },
      'sep',
      { label: 'Exit', icon: 'close', action: () => win.close() },
    ],
    edit: () => [
      { label: 'Undo', icon: 'undo', shortcut: 'Ctrl+Z', action: () => document.execCommand('undo') },
      'sep',
      { label: 'Cut', icon: 'cut', shortcut: 'Ctrl+X', action: () => document.execCommand('cut') },
      { label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
      { label: 'Paste', icon: 'paste', shortcut: 'Ctrl+V', action: () => document.execCommand('paste') },
      { label: 'Delete', icon: 'trash', shortcut: 'Del', action: () => document.execCommand('delete') },
      'sep',
      { label: 'Find…', icon: 'search', shortcut: 'Ctrl+F', action: () => findDialog() },
      { label: 'Select all', shortcut: 'Ctrl+A', action: () => ta.select() },
      { label: 'Time/Date', shortcut: 'F5', action: () => {
        const d = new Date();
        insert(`${pad2(d.getHours())}:${pad2(d.getMinutes())} ${d.toLocaleDateString()}`);
      } },
    ],
    format: () => [
      { label: 'Word wrap', checked: wrap, action: () => { wrap = !wrap; ta.classList.toggle('wrap', wrap); } },
      { label: 'Font…', icon: 'text', action: () => fontDialog() },
    ],
    view: () => [
      { label: 'Zoom in', shortcut: 'Ctrl++', action: () => zoom(1) },
      { label: 'Zoom out', shortcut: 'Ctrl+-', action: () => zoom(-1) },
      { label: 'Restore default zoom', shortcut: 'Ctrl+0', action: () => { ta.style.fontSize = '13.5px'; } },
    ],
    help: () => [
      { label: 'About Notepad', icon: 'info', action: () => showDialog({
        title: 'About Notepad',
        body: `<div style="display:flex;gap:14px;align-items:center"><span style="width:44px;height:44px">${icon('notepad', 44)}</span>
          <div><b>Notepad</b><div style="color:#666;font-size:11.5px;margin-top:3px">Windows 10 · Version 19045.3803<br>A text editor, faithfully rebuilt in your browser.</div></div></div>`,
        buttons: [{ id: 'ok', label: 'OK', primary: true }],
      }) },
    ],
  };

  win.body.querySelectorAll('[data-menu]').forEach((b) => {
    b.addEventListener('click', () => {
      const r = b.getBoundingClientRect();
      openMenu(r.left, r.bottom + 2, menus[b.dataset.menu]());
    });
  });

  function zoom(delta) {
    const cur = parseFloat(getComputedStyle(ta).fontSize);
    ta.style.fontSize = Math.max(9, Math.min(28, cur + delta * 1.5)) + 'px';
  }

  function insert(text) {
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    setDirty(true);
  }

  function findDialog() {
    showDialog({
      title: 'Find', body: `<div style="display:flex;gap:8px;align-items:center"><span>Find what:</span><input type="text" id="find-q" style="flex:1;height:26px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:0 6px"></div>`,
      buttons: [{ id: 'cancel', label: 'Cancel' }, { id: 'ok', label: 'Find Next', primary: true }],
    }).then((r) => {
      if (r !== 'ok') return;
      const q = document.getElementById('find-q')?.value || '';
      const idx = ta.value.toLowerCase().indexOf(q.toLowerCase(), ta.selectionEnd);
      if (idx >= 0) { ta.focus(); ta.setSelectionRange(idx, idx + q.length); }
      else notify({ title: 'Notepad', body: `Cannot find "${q}"`, icon: 'notepad' });
    });
    requestAnimationFrame(() => {
      const inp = document.getElementById('find-q');
      inp?.focus();
    });
  }

  function fontDialog() {
    showDialog({
      title: 'Font',
      body: `<div style="display:flex;gap:10px"><label style="flex:1">Font size<input id="fs" type="number" value="${parseInt(getComputedStyle(ta).fontSize)}" min="8" max="40" style="width:100%;height:26px;margin-top:4px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:0 6px"></label></div>`,
      buttons: [{ id: 'cancel', label: 'Cancel' }, { id: 'ok', label: 'OK', primary: true }],
    }).then((r) => {
      if (r === 'ok') {
        const v = +document.getElementById('fs').value;
        if (v >= 8 && v <= 40) ta.style.fontSize = v + 'px';
      }
    });
  }

  ta.addEventListener('input', () => { setDirty(true); updatePos(); });
  ta.addEventListener('keyup', updatePos);
  ta.addEventListener('click', updatePos);
  ta.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); e.shiftKey ? saveAsFile() : save(); }
    else if (e.ctrlKey && e.key.toLowerCase() === 'o') { e.preventDefault(); openFile(); }
    else if (e.ctrlKey && e.key.toLowerCase() === 'n' && !e.shiftKey) { e.preventDefault(); newFile(); }
    else if (e.key === 'F5') { e.preventDefault(); const d = new Date(); insert(`${pad2(d.getHours())}:${pad2(d.getMinutes())} ${d.toLocaleDateString()}`); }
    else if (e.key === 'Tab') { e.preventDefault(); insert('    '); }
  });

  win.onBeforeClose = () => {
    if (!dirty) return true;
    confirmDiscard(() => { win.onBeforeClose = null; win.close(); });
    return false;
  };

  if (filePath) {
    load(filePath);
  } else {
    // open with something to read rather than a blank page
    const sample = 'C:\\Users\\Alex\\Documents\\Welcome.txt';
    if (getNode(sample)?.type === 'file') load(sample);
    else setDirty(false);
    setTimeout(() => ta.focus(), 60);
  }

  return win;
}
