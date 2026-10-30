/* ============================================================
   Recycle Bin
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc, fmtDate, fmtBytes, bus, showDialog } from '../utils.js';
import { state, restore, emptyRecycle, deleteForever } from '../store.js';
import { notify } from '../notify.js';

export const meta = { id: 'recycle', name: 'Recycle Bin', icon: 'recycle' };

export function launch() {
  const win = createWindow({
    title: 'Recycle Bin', icon: 'recycle', width: 820, height: 540,
    minWidth: 520, minHeight: 320, appId: 'recycle',
  });

  function render() {
    const items = state.recycle || [];
    win.body.innerHTML = `
      <div class="bin">
        <div class="bin-head">
          <button class="tb-text" id="bin-empty">${icon('trash')} Empty Recycle Bin</button>
          <button class="tb-text" id="bin-restore-all">${icon('undo')} Restore all items</button>
          <span style="margin-left:auto;color:var(--muted)">${items.length} item${items.length === 1 ? '' : 's'}</span>
        </div>
        <div class="tm-head"><span class="tm-name">Name</span><span style="width:230px">Original location</span><span style="width:140px">Date deleted</span><span style="width:90px;text-align:right">Size</span></div>
        <div class="tm-body" id="bin-body">
          ${items.length ? items.map((it, i) => `<div class="tm-row" data-i="${i}">
            <span class="tm-name"><span style="width:16px;height:16px;display:inline-flex">${icon(it.node.type === 'folder' ? 'folder' : 'notepad')}</span><span>${esc(it.node.name)}</span></span>
            <span style="width:230px;color:var(--muted);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.path)}</span>
            <span style="width:140px;color:var(--muted);font-size:11.5px">${fmtDate(it.deletedAt)}</span>
            <span style="width:90px;text-align:right;color:var(--muted);font-size:11.5px">${it.node.type === 'file' ? fmtBytes(String(it.node.content || '').length) : '—'}</span>
          </div>`).join('') : `<div class="exp-empty">${icon('recycle')}<div>The Recycle Bin is empty.</div></div>`}
        </div>
        <div class="app-statusbar"><span id="bin-sel">Select an item and press Restore</span><span style="margin-left:auto"><button class="tb-text" id="bin-restore" style="height:20px">${icon('undo')} Restore the selected item</button></span></div>
      </div>`;

    win.body.querySelectorAll('.tm-row[data-i]').forEach((row) => {
      row.addEventListener('click', () => {
        win.body.querySelectorAll('.tm-row').forEach((r) => r.classList.remove('selected'));
        row.classList.add('selected');
        win.body.querySelector('#bin-sel').textContent = `Selected: ${items[+row.dataset.i].node.name}`;
        row.dataset.selected = '1';
      });
    });
    win.body.querySelectorAll('.tm-row[data-i]').forEach((row) => {
      row.addEventListener('dblclick', () => {
        restore(+row.dataset.i);
        notify({ title: 'Recycle Bin', body: `"${items[+row.dataset.i].node.name}" was restored.`, icon: 'recycle' });
        bus.emit('recycle:changed');
        bus.emit('fs:changed');
        render();
      });
      row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        import('../contextmenu.js').then(({ openMenu }) => openMenu(e.clientX, e.clientY, [
          { label: 'Restore', icon: 'undo', action: () => { restore(+row.dataset.i); bus.emit('recycle:changed'); render(); } },
          { label: 'Delete permanently', icon: 'trash', danger: true, action: () => { deleteForever(+row.dataset.i); bus.emit('recycle:changed'); render(); } },
        ]));
      });
    });

    win.body.querySelector('#bin-empty').addEventListener('click', async () => {
      if (!items.length) return;
      const r = await showDialog({
        title: 'Delete multiple items',
        body: `Are you sure you want to permanently delete these ${items.length} items?`,
        buttons: [{ id: 'cancel', label: 'Cancel' }, { id: 'yes', label: 'Yes', primary: true }],
      });
      if (r === 'yes') {
        emptyRecycle();
        bus.emit('recycle:changed');
        render();
        notify({ title: 'Recycle Bin', body: 'The Recycle Bin is empty.', icon: 'recycle' });
      }
    });
    win.body.querySelector('#bin-restore-all').addEventListener('click', () => {
      if (!items.length) return;
      let n = 0;
      while (state.recycle.length) { if (restore(0)) n++; else break; }
      bus.emit('recycle:changed');
      render();
      notify({ title: 'Recycle Bin', body: `Restored ${n} item${n === 1 ? '' : 's'}.`, icon: 'recycle' });
    });
    win.body.querySelector('#bin-restore').addEventListener('click', () => {
      const row = win.body.querySelector('.tm-row.selected');
      if (!row) return;
      restore(+row.dataset.selected ? +row.dataset.i : +row.dataset.i);
      bus.emit('recycle:changed');
      render();
    });
  }

  bus.on('recycle:changed', () => { if (!win.closed) render(); });
  render();
  return win;
}
