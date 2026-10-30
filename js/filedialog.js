/* ============================================================
   Classic file open / save dialog
   ============================================================ */

import { el, esc, fmtBytes, typeLabel, fileIconName } from './utils.js';
import { icon } from './icons.js';
import { list, getNode, parentPath, baseName, joinPath } from './store.js';

const PLACES = [
  { label: 'Documents', path: 'C:\\Users\\Alex\\Documents', icon: 'documents' },
  { label: 'Desktop', path: 'C:\\Users\\Alex\\Desktop', icon: 'desktop' },
  { label: 'Downloads', path: 'C:\\Users\\Alex\\Downloads', icon: 'download' },
  { label: 'Pictures', path: 'C:\\Users\\Alex\\Pictures', icon: 'pictures' },
  { label: 'Music', path: 'C:\\Users\\Alex\\Music', icon: 'music' },
  { label: 'Local Disk (C:)', path: 'C:', icon: 'disk' },
];

export function fileDialog({ mode = 'open', title = 'Open', initialPath = 'C:\\Users\\Alex\\Documents', initialName = '', ext = 'txt' } = {}) {
  return new Promise((resolve) => {
    let path = initialPath;
    let selected = null;
    let fileName = initialName;

    const backdrop = el('div', { class: 'dialog-backdrop' });
    const dlg = el('div', { class: 'dialog', style: { width: '720px', maxWidth: '94vw' } });
    backdrop.append(dlg);
    document.getElementById('screen').append(backdrop);

    const close = (val) => { backdrop.remove(); document.removeEventListener('keydown', onKey, true); resolve(val); };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(null); } };
    document.addEventListener('keydown', onKey, true);

    function nav(p) {
      if (getNode(p) == null) return;
      path = p;
      selected = null;
      render();
    }

    function render() {
      const items = list(path).filter((it) => it.type !== 'drive' || path === '');
      dlg.innerHTML = `
        <div class="d-head"><span style="display:flex;gap:6px;align-items:center">${icon(mode === 'open' ? 'open' : 'save')}<span>${esc(title)}</span></span></div>
        <div style="display:flex;height:340px">
          <div style="width:180px;border-right:1px solid var(--line);background:var(--win-bg-alt);padding:8px 4px;overflow:auto">
            ${PLACES.map((p) => `<div class="side-item ${p.path === path ? 'active' : ''}" data-place="${esc(p.path)}" style="display:flex;gap:8px;align-items:center;height:28px;padding:0 8px;font-size:12px;border-radius:2px">
              <span style="width:16px;height:16px;display:inline-flex">${icon(p.icon)}</span>${p.label}</div>`).join('')}
          </div>
          <div style="flex:1;display:flex;flex-direction:column;min-width:0">
            <div style="display:flex;align-items:center;gap:4px;padding:6px;border-bottom:1px solid var(--line)">
              <button class="tb-icon" data-up title="Up">${icon('up')}</button>
              <div style="flex:1;font-size:12px;padding:0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(path || 'This PC')}</div>
            </div>
            <div style="flex:1;overflow:auto;padding:4px" id="fd-list">
              ${items.length ? items.map((it) => `<div class="fd-item" data-path="${esc(it.path)}" data-type="${it.type}" style="display:flex;gap:8px;align-items:center;height:28px;padding:0 8px;font-size:12px;border-radius:2px">
                <span style="width:17px;height:17px;display:inline-flex">${icon(it.type === 'file' ? fileIconName(it.name) : 'folder')}</span>
                <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.name)}</span>
                <span style="color:var(--muted);font-size:11px">${it.type === 'file' ? fmtBytes(String(it.content || '').length) : 'File folder'}</span>
              </div>`).join('') : '<div style="padding:20px;color:var(--muted);font-size:12px;text-align:center">This folder is empty</div>'}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;padding:10px 14px;border-top:1px solid var(--line)">
          <span style="font-size:12px">File name:</span>
          <input id="fd-name" type="text" value="${esc(fileName || (mode === 'save' ? `Untitled.${ext}` : ''))}" style="flex:1;height:28px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:0 8px;outline:none;font-size:12px">
          <span style="font-size:11px;color:var(--muted)">.${ext}</span>
        </div>
        <div class="d-foot" style="padding:10px 14px 14px">
          <button class="btn" data-cancel>Cancel</button>
          <button class="btn primary" data-ok>${mode === 'open' ? 'Open' : 'Save'}</button>
        </div>`;

      dlg.querySelectorAll('[data-place]').forEach((p) => p.addEventListener('click', () => nav(p.dataset.place)));
      dlg.querySelector('[data-up]')?.addEventListener('click', () => nav(parentPath(path) || ''));
      dlg.querySelectorAll('.fd-item').forEach((row) => {
        row.addEventListener('pointerenter', () => row.style.background = 'var(--hover)');
        row.addEventListener('pointerleave', () => { if (selected !== row.dataset.path) row.style.background = 'transparent'; });
        row.addEventListener('click', () => {
          selected = row.dataset.path;
          if (row.dataset.type === 'file') {
            const input = dlg.querySelector('#fd-name');
            if (input) input.value = baseName(selected);
            dlg.querySelectorAll('.fd-item').forEach((r) => { r.style.background = 'transparent'; r.style.color = ''; });
            row.style.background = 'var(--accent)';
            row.style.color = '#fff';
          } else {
            fileName = baseName(row.dataset.path);
          }
        });
        row.addEventListener('dblclick', () => {
          if (row.dataset.type === 'file') { close(row.dataset.path); }
          else nav(row.dataset.path);
        });
      });
      const nameInput = dlg.querySelector('#fd-name');
      nameInput.addEventListener('input', () => { fileName = nameInput.value; });
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); ok(); }
      });
      dlg.querySelector('[data-cancel]').addEventListener('click', () => close(null));
      dlg.querySelector('[data-ok]').addEventListener('click', ok);

      function ok() {
        if (mode === 'save') {
          const name = (dlg.querySelector('#fd-name').value || '').trim() || `Untitled.${ext}`;
          close(joinPath(path, name.includes('.') ? name : `${name}.${ext}`));
        } else {
          if (selected && getNode(selected)?.type === 'file') return close(selected);
          const name = (dlg.querySelector('#fd-name').value || '').trim();
          if (name) {
            const target = joinPath(path, name);
            if (getNode(target)) return close(target);
          }
          close(null);
        }
      }
    }

    render();
    setTimeout(() => dlg.querySelector('#fd-name')?.focus(), 30);
  });
}
