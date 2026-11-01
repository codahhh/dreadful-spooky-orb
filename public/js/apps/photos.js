/* ============================================================
   Photos
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc, fmtDate, bus } from '../utils.js';
import { state, getNode, parentPath, baseName, remove } from '../store.js';
import { notify } from '../notify.js';
import { openApp } from '../launcher.js';

export const meta = { id: 'photos', name: 'Photos', icon: 'photos' };

function walkImages(node, path, out) {
  if (!node.children) return;
  node.children.forEach((child) => {
    if (child.type === 'drive') { walkImages(child, child.letter, out); return; }
    const p = path ? path + '\\' + child.name : child.name;
    if (child.type === 'file') {
      if (child.kind === 'image' || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(child.name)) {
        out.push({ name: child.name, path: p, src: child.content, modified: child.modified });
      }
    } else walkImages(child, p, out);
  });
}

export function allImages() {
  const out = [];
  state.fs.children.forEach((drive) => walkImages(drive, drive.letter || drive.name, out));
  return out;
}

export function launch(args = {}) {
  const win = createWindow({
    title: 'Photos', icon: 'photos', width: 980, height: 660,
    minWidth: 560, minHeight: 360, appId: 'photos',
  });

  let images = allImages();
  let viewing = args.path ? Math.max(0, images.findIndex((i) => i.path === args.path)) : -1;
  let folder = 'all';
  let filter = '';

  win.body.innerHTML = `
    <div class="photos">
      <div class="photos-side">
        <div class="g" style="font-size:12px;color:#bbb;font-weight:600;padding-bottom:6px">${icon('photos')} Collection</div>
        <div class="g" data-folder="all">${icon('photos')} All photos <span style="margin-left:auto;color:#888">${images.length}</span></div>
        <div class="g" data-folder="C:\\Users\\Alex\\Pictures">${icon('pictures')} Pictures</div>
        <div class="g" data-folder="C:\\Users\\Alex\\Pictures\\Screenshots">${icon('display')} Screenshots</div>
        <div class="g" data-folder="C:\\Users\\Alex\\Documents">${icon('documents')} Documents</div>
        <div style="font-size:12px;color:#bbb;font-weight:600;padding:14px 10px 6px">Albums</div>
        <div class="g">${icon('star')} Favourites</div>
        <div class="g">${icon('clock')} Recent</div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.1)">
          <div style="font-size:13px;font-weight:500">All photos</div>
          <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
            <div style="display:flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.18);border-radius:2px;padding:0 8px;height:26px;color:#ddd">
              ${icon('search')}<input id="ph-search" placeholder="Search" style="background:transparent;border:0;outline:none;color:#eee;width:120px;font-size:11.5px">
            </div>
            <button id="ph-add" class="tb-icon" title="Open Paint" style="color:#eee">${icon('paint')}</button>
          </div>
        </div>
        <div class="photos-grid" id="ph-grid"></div>
      </div>
      <div class="photos-view" id="ph-view" hidden></div>
    </div>`;

  const grid = win.body.querySelector('#ph-grid');
  const viewer = win.body.querySelector('#ph-view');

  function renderGrid() {
    images = allImages();
    let list = images;
    if (folder !== 'all') list = images.filter((i) => parentPath(i.path).toLowerCase().startsWith(folder.toLowerCase()));
    if (filter) list = list.filter((i) => i.name.toLowerCase().includes(filter.toLowerCase()));
    win.body.querySelectorAll('[data-folder]').forEach((n) => n.style.background = n.dataset.folder === folder ? 'rgba(255,255,255,.14)' : '');
    grid.innerHTML = list.length ? list.map((im, i) => `
      <button class="photos-thumb" data-i="${i}">
        <img src="${im.src}" alt="${esc(im.name)}" loading="lazy">
        <span>${esc(im.name)}</span>
      </button>`).join('') : `<div style="grid-column:1/-1;color:#999;text-align:center;padding:40px;font-size:12.5px">No photos here yet. Draw something in Paint and save it to Pictures.</div>`;
    grid.querySelectorAll('.photos-thumb').forEach((t) => t.addEventListener('click', () => {
      viewing = images.indexOf(list[+t.dataset.i]);
      openViewer();
    }));
  }

  function openViewer() {
    if (viewing < 0 || !images[viewing]) return;
    const im = images[viewing];
    viewer.hidden = false;
    viewer.innerHTML = `
      <div class="pv-top">
        <button class="tb-icon" id="pv-close" style="color:#eee">${icon('close')}</button>
        <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(im.name)}</span>
        <span style="color:#aaa;font-size:11px">${fmtDate(im.modified)}</span>
        <button class="tb-icon" id="pv-open-paint" title="Edit in Paint" style="color:#eee">${icon('paint')}</button>
        <button class="tb-icon" id="pv-del" title="Delete" style="color:#eee">${icon('trash')}</button>
      </div>
      <div class="pv-stage"><img src="${im.src}" alt=""></div>
      <div class="pv-nav prev" id="pv-prev">${icon('back')}</div>
      <div class="pv-nav next" id="pv-next">${icon('forward')}</div>
      <div style="display:flex;justify-content:center;gap:22px;padding:10px;background:rgba(0,0,0,.4);font-size:11px;color:#bbb">
        <span>${viewing + 1} of ${images.length}</span><span>${esc(im.path)}</span>
      </div>`;
    viewer.querySelector('#pv-close').addEventListener('click', () => { viewer.hidden = true; });
    viewer.querySelector('#pv-prev').addEventListener('click', () => { viewing = (viewing - 1 + images.length) % images.length; openViewer(); });
    viewer.querySelector('#pv-next').addEventListener('click', () => { viewing = (viewing + 1) % images.length; openViewer(); });
    viewer.querySelector('#pv-open-paint').addEventListener('click', () => openApp('paint', { path: im.path }));
    viewer.querySelector('#pv-del').addEventListener('click', async () => {
      remove(im.path);
      images = allImages();
      viewing = Math.min(viewing, images.length - 1);
      viewer.hidden = true;
      renderGrid();
      notify({ title: 'Photos', body: 'Moved to the Recycle Bin.', icon: 'recycle' });
      bus.emit('recycle:changed');
    });
  }

  win.body.querySelectorAll('[data-folder]').forEach((n) => n.addEventListener('click', () => {
    folder = n.dataset.folder;
    renderGrid();
  }));
  win.body.querySelector('#ph-search').addEventListener('input', (e) => { filter = e.target.value; renderGrid(); });
  win.body.querySelector('#ph-add').addEventListener('click', () => openApp('paint'));

  win.body.addEventListener('keydown', (e) => {
    if (viewer.hidden) return;
    if (e.key === 'Escape') viewer.hidden = true;
    if (e.key === 'ArrowLeft') { viewing = (viewing - 1 + images.length) % images.length; openViewer(); }
    if (e.key === 'ArrowRight') { viewing = (viewing + 1) % images.length; openViewer(); }
  });
  win.body.tabIndex = 0;

  bus.on('fs:changed', renderGrid);
  renderGrid();
  if (viewing >= 0 && images.length) openViewer();
  return win;
}
