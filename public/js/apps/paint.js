/* ============================================================
   Paint
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, showDialog, promptDialog, bus, fileIconName } from '../utils.js';
import { saveAs, read, baseName, getNode } from '../store.js';
import { fileDialog } from '../filedialog.js';
import { notify } from '../notify.js';
import { openApp } from '../launcher.js';

export const meta = { id: 'paint', name: 'Paint', icon: 'paint' };

const TOOLS = [
  { id: 'pencil', icon: 'edit', title: 'Pencil' },
  { id: 'brush', icon: 'paint', title: 'Brush' },
  { id: 'eraser', icon: 'eraser', title: 'Eraser' },
  { id: 'line', icon: 'line', title: 'Line' },
  { id: 'rect', icon: 'square', title: 'Rectangle' },
  { id: 'ellipse', icon: 'circle', title: 'Ellipse' },
  { id: 'fill', icon: 'fill', title: 'Fill with colour' },
  { id: 'text', icon: 'text', title: 'Text' },
  { id: 'picker', icon: 'eyedropper', title: 'Colour picker' },
];

const PALETTE = [
  '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
  '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7',
];

export function launch(args = {}) {
  const win = createWindow({
    title: 'Untitled - Paint', icon: 'paint', width: 980, height: 660,
    minWidth: 640, minHeight: 420, appId: 'paint',
  });

  let tool = 'pencil';
  let color = '#000000';
  let bg = '#ffffff';
  let size = 4;
  let drawing = false;
  let start = null;
  let snapshot = null;
  let target = null;
  const undoStack = [];
  let filePath = null;

  win.body.innerHTML = `
    <div class="paint">
      <div class="paint-ribbon">
        <div style="display:flex;gap:2px;align-items:center;padding-right:8px;border-right:1px solid var(--line)">
          <button class="tb-icon" id="pt-new" title="New">${icon('newfile')}</button>
          <button class="tb-icon" id="pt-open" title="Open">${icon('open')}</button>
          <button class="tb-icon" id="pt-save" title="Save">${icon('save')}</button>
          <button class="tb-icon" id="pt-undo" title="Undo">${icon('undo')}</button>
        </div>
        <div class="paint-tools" style="display:flex;gap:2px;flex-wrap:wrap"></div>
      </div>
      <div class="paint-colors">
        <div class="paint-current" title="Current colours" id="pt-current">
          <span class="fg" style="background:${color}"></span><span class="bg"></span>
        </div>
        <div class="paint-swatches" style="display:grid;grid-template-columns:repeat(10,18px);gap:4px"></div>
        <div style="margin-left:auto;display:flex;align-items:center;gap:8px;font-size:11px;color:var(--muted)">
          <span>Size</span>
          <input type="range" class="paint-size" id="pt-size" min="1" max="48" value="4">
          <span id="pt-size-val" style="width:22px">4</span>
          <input type="color" id="pt-color" value="#000000" style="width:26px;height:24px;border:1px solid var(--line);background:transparent;padding:0">
        </div>
      </div>
      <div class="paint-canvas-wrap" id="pt-wrap">
        <canvas class="paint-canvas" width="900" height="520" id="pt-canvas"></canvas>
      </div>
      <div class="paint-status">
        <span id="pt-pos">0, 0 px</span>
        <span id="pt-dim">900 × 520 px</span>
        <span id="pt-tool">Pencil</span>
        <span style="margin-left:auto" id="pt-file">Untitled</span>
      </div>
    </div>`;

  const toolsEl = win.body.querySelector('.paint-tools');
  TOOLS.forEach((t) => {
    const b = el('button', { class: 'paint-tool' + (t.id === tool ? ' active' : ''), title: t.title, dataset: { tool: t.id } });
    b.innerHTML = icon(t.icon || 'pencil');
    b.addEventListener('click', () => {
      tool = t.id;
      toolsEl.querySelectorAll('.paint-tool').forEach((x) => x.classList.toggle('active', x.dataset.tool === tool));
      win.body.querySelector('#pt-tool').textContent = t.title;
    });
    toolsEl.append(b);
  });

  const swEl = win.body.querySelector('.paint-swatches');
  PALETTE.forEach((c) => {
    const s = el('button', { class: 'paint-swatch', style: { background: c }, title: c });
    s.addEventListener('click', () => setColor(c));
    swEl.append(s);
  });

  const canvas = win.body.querySelector('#pt-canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  clearCanvas();

  function clearCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setTitle();
  }

  function setTitle() {
    const name = filePath ? baseName(filePath) : 'Untitled';
    win.setTitle(`${name} - Paint`);
    win.body.querySelector('#pt-file').textContent = name;
  }

  function setColor(c) {
    color = c;
    win.body.querySelector('#pt-color').value = c;
    win.body.querySelector('#pt-current .fg').style.background = c;
  }

  win.body.querySelector('#pt-color').addEventListener('input', (e) => {
    color = e.target.value;
    win.body.querySelector('#pt-current .fg').style.background = color;
  });
  const sizeInput = win.body.querySelector('#pt-size');
  sizeInput.addEventListener('input', (e) => {
    size = +e.target.value;
    win.body.querySelector('#pt-size-val').textContent = size;
  });

  function pushUndo() {
    undoStack.push(canvas.toDataURL());
    if (undoStack.length > 12) undoStack.shift();
  }

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: Math.round((e.clientX - r.left) * canvas.width / r.width), y: Math.round((e.clientY - r.top) * canvas.height / r.height) };
  }

  function strokeStyle() {
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'brush' ? size * 2.4 : size;
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const p = pos(e);
    start = p;
    target = e.target;
    pushUndo();
    strokeStyle();

    if (tool === 'picker') {
      const d = ctx.getImageData(p.x, p.y, 1, 1).data;
      setColor('#' + [d[0], d[1], d[2]].map((n) => n.toString(16).padStart(2, '0')).join(''));
      return;
    }
    if (tool === 'fill') { floodFill(p.x, p.y, color); return; }
    if (tool === 'text') {
      promptDialog('Text', '', 'Enter text:').then((txt) => {
        if (!txt) return;
        ctx.fillStyle = color;
        ctx.font = `${Math.max(14, size * 4)}px "Segoe UI", Arial, sans-serif`;
        ctx.fillText(txt, p.x, p.y);
      });
      return;
    }
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 0.01, p.y + 0.01);
      ctx.stroke();
    } else {
      snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    win.body.querySelector('#pt-pos').textContent = `${p.x}, ${p.y} px`;
  });

  canvas.addEventListener('pointermove', (e) => {
    const p = pos(e);
    win.body.querySelector('#pt-pos').textContent = `${p.x}, ${p.y} px`;
    if (!drawing) return;
    strokeStyle();
    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    } else if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
      ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();
      if (tool === 'line') { ctx.moveTo(start.x, start.y); ctx.lineTo(p.x, p.y); }
      else if (tool === 'rect') ctx.rect(start.x, start.y, p.x - start.x, p.y - start.y);
      else {
        const cx = (start.x + p.x) / 2, cy = (start.y + p.y) / 2;
        ctx.ellipse(cx, cy, Math.abs(p.x - start.x) / 2, Math.abs(p.y - start.y) / 2, 0, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
  });

  const endDraw = () => {
    if (drawing) { drawing = false; ctx.closePath(); }
  };
  canvas.addEventListener('pointerup', endDraw);
  canvas.addEventListener('pointercancel', endDraw);
  canvas.addEventListener('pointerleave', () => { if (drawing && (tool === 'pencil' || tool === 'brush' || tool === 'eraser')) drawing = false; });

  function floodFill(x, y, hex) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    const idx = (x + y * canvas.width) * 4;
    const targetRGB = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
    const m = hex.match(/\w\w/g).map((h) => parseInt(h, 16));
    const fill = [...m, 255];
    if (targetRGB.every((v, i) => v === fill[i])) return;
    const stack = [[x, y]];
    const seen = new Uint8Array(canvas.width * canvas.height);
    const match = (i) => Math.abs(data[i] - targetRGB[0]) < 24 && Math.abs(data[i + 1] - targetRGB[1]) < 24 && Math.abs(data[i + 2] - targetRGB[2]) < 24;
    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= canvas.width || cy >= canvas.height) continue;
      const pi = cy * canvas.width + cx;
      if (seen[pi]) continue;
      seen[pi] = 1;
      const di = pi * 4;
      if (!match(di)) continue;
      data[di] = fill[0]; data[di + 1] = fill[1]; data[di + 2] = fill[2]; data[di + 3] = 255;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    ctx.putImageData(img, 0, 0);
  }

  // toolbar actions
  win.body.querySelector('#pt-undo').addEventListener('click', () => {
    const last = undoStack.pop();
    if (!last) return;
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
    img.src = last;
  });
  win.body.querySelector('#pt-new').addEventListener('click', async () => {
    if (!(await confirmDiscard())) return;
    clearCanvas();
    filePath = null;
    undoStack.length = 0;
    setTitle();
  });
  win.body.querySelector('#pt-open').addEventListener('click', async () => {
    const p = await fileDialog({ mode: 'open', title: 'Open', initialPath: 'C:\\Users\\Alex\\Pictures' });
    if (!p) return;
    const data = read(p);
    if (!data || !/^data:image|^https?:/.test(data)) {
      notify({ title: 'Paint', body: 'That file is not an image Paint can open.', icon: 'paint' });
      return;
    }
    loadImage(data, p);
  });
  win.body.querySelector('#pt-save').addEventListener('click', saveImage);

  function loadImage(src, path) {
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      canvas.style.width = Math.min(img.width, 1100) + 'px';
      canvas.style.height = 'auto';
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      win.body.querySelector('#pt-dim').textContent = `${img.width} × ${img.height} px`;
      filePath = path || null;
      setTitle();
    };
    img.onerror = () => notify({ title: 'Paint', body: 'Could not decode that image.', icon: 'paint' });
    img.src = src;
  }

  async function confirmDiscard() {
    return true;
  }

  async function saveImage() {
    const path = await fileDialog({
      mode: 'save', title: 'Save As', initialPath: 'C:\\Users\\Alex\\Pictures',
      initialName: filePath ? baseName(filePath) : 'Drawing.png', ext: 'png',
    });
    if (!path) return;
    saveAs(path, canvas.toDataURL('image/png'), 'image');
    filePath = path;
    setTitle();
    notify({ title: 'Paint', body: `Saved to ${path}`, icon: 'paint' });
    bus.emit('fs:changed');
  }

  setTitle();
  if (args.path) {
    const data = read(args.path);
    if (data) loadImage(data, args.path);
  }
  return win;
}
