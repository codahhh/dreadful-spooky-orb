/* ============================================================
   Open a file with its associated application
   ============================================================ */

import { getNode, list, parentPath, baseName } from './store.js';
import { openApp } from './launcher.js';
import { showDialog, fmtBytes } from './utils.js';
import { icon } from './icons.js';

export function openFile(path, opts = {}) {
  const node = getNode(path);
  if (!node) return;
  if (node.type === 'folder' || node.type === 'drive') {
    openApp('explorer', { path, ...opts });
    return;
  }
  if (node.kind === 'image' || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(node.name)) {
    openApp('photos', { path });
    return;
  }
  if (node.kind === 'text' || /\.(txt|md|log|ini|cfg|json|csv|js|css|html|ps1|bat)$/i.test(node.name)) {
    openApp('notepad', { path });
    return;
  }
  showDialog({
    title: 'How do you want to open this file?',
    body: `<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
        <span style="width:34px;height:34px">${icon('file')}</span>
        <span><b>${node.name}</b><div style="color:#777;font-size:11.5px">${fmtBytes(String(node.content || '').length)} · ${path}</div></span>
      </div>
      <div style="color:#666;font-size:12px">This file type has no registered handler in this build.
      Try renaming it to <b>.txt</b> and opening it with Notepad.</div>`,
    buttons: [{ id: 'cancel', label: 'Cancel' }, { id: 'np', label: 'Open with Notepad', primary: true }],
  }).then((r) => {
    if (r === 'np') openApp('notepad', { path });
  });
}

export function folderSummary(path) {
  const items = list(path);
  return `${items.length} item${items.length === 1 ? '' : 's'}`;
}
