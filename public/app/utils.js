/* ============================================================
   Utilities: DOM helpers, formatting, event bus, dialogs
   ============================================================ */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'disabled') node.disabled = !!v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(9)) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function esc(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const uid = (p = 'id') => p + '-' + Math.random().toString(36).slice(2, 9);

/* ------------------------------ bus ------------------------------ */
const listeners = new Map();
export const bus = {
  on(evt, fn) {
    if (!listeners.has(evt)) listeners.set(evt, new Set());
    listeners.get(evt).add(fn);
    return () => listeners.get(evt)?.delete(fn);
  },
  emit(evt, data) {
    listeners.get(evt)?.forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } });
    listeners.get('*')?.forEach((fn) => fn({ evt, data }));
  },
};

export function debounce(fn, ms = 300) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* ------------------------------ format ------------------------------ */
export function fmtBytes(n) {
  if (n == null) return '';
  if (n < 1024) return n + ' bytes';
  const units = ['KB', 'MB', 'GB', 'TB'];
  let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < units.length - 1);
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} ${units[i]}`;
}

export const pad2 = (n) => String(n).padStart(2, '0');

export function fmtDate(ts, withTime = true) {
  if (!ts) return '';
  const d = new Date(ts);
  const date = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  return withTime ? `${date} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` : date;
}

export function fmtTime(ts = Date.now()) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/* ------------------------------ modals ------------------------------ */
/**
 * Show a modal dialog over the whole desktop.
 * buttons: [{id,label,primary,danger}]
 * resolves with button id (or null when dismissed with Esc)
 */
export function showDialog({ title = 'Windows', body = '', buttons = [{ id: 'ok', label: 'OK', primary: true }], width = 420, icon = '' } = {}) {
  return new Promise((resolve) => {
    const backdrop = el('div', { class: 'dialog-backdrop' });
    const dlg = el('div', { class: 'dialog', style: { minWidth: Math.min(width, window.innerWidth - 40) + 'px' } });
    const close = (val) => {
      document.removeEventListener('keydown', onKey, true);
      backdrop.remove();
      resolve(val);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(null); }
    };
    const head = el('div', { class: 'd-head' }, icon ? el('span', { html: icon, style: { marginRight: '6px', display: 'flex' } }) : null, el('span', { text: title }));
    const bodyEl = el('div', { class: 'd-body' });
    if (typeof body === 'string') bodyEl.innerHTML = body; else bodyEl.append(body);
    const foot = el('div', { class: 'd-foot' });
    buttons.forEach((b) => {
      foot.append(el('button', {
        class: 'btn' + (b.primary ? ' primary' : ''),
        text: b.label,
        onclick: () => close(b.id),
      }));
    });
    dlg.append(head, bodyEl, foot);
    backdrop.append(dlg);
    backdrop.addEventListener('pointerdown', (e) => { if (e.target === backdrop) close(null); });
    document.addEventListener('keydown', onKey, true);
    $('#screen').append(backdrop);
  });
}

export function promptDialog(title, value = '', label = 'Name') {
  const input = el('input', { type: 'text', value, style: { width: '100%', height: '28px', border: '1px solid var(--line)', background: 'var(--win-bg)', color: 'var(--win-fg)', padding: '0 8px', outline: 'none' } });
  const body = el('div', {}, el('div', { text: label, style: { marginBottom: '6px' } }), input);
  const p = showDialog({ title, body, buttons: [{ id: 'cancel', label: 'Cancel' }, { id: 'ok', label: 'OK', primary: true }] });
  setTimeout(() => { input.focus(); input.select(); }, 40);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.closest('.dialog')?.querySelector('.d-foot .btn.primary')?.click();
    }
  });
  return p.then((r) => (r === 'ok' ? input.value : null));
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- touch / small screen ---------- */
export function isNarrow() {
  return typeof window !== 'undefined' && window.innerWidth <= 760;
}
export function isTouchUI() {
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia('(pointer: coarse)').matches || isNarrow();
  } catch (_) {
    return isNarrow();
  }
}

/** wrap a rounded rect path helper for canvas */
export function fileKind(name = '') {
  const ext = name.split('.').pop().toLowerCase();
  if (['txt', 'md', 'log', 'ini', 'json', 'csv', 'cfg', 'bat', 'ps1', 'js', 'css', 'html'].includes(ext)) return 'text';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'flac', 'm4a', 'ogg'].includes(ext)) return 'audio';
  if (['mp4', 'mkv', 'mov', 'webm', 'avi'].includes(ext)) return 'video';
  return 'other';
}

export function fileIconName(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['txt', 'md', 'log', 'ini', 'cfg'].includes(ext)) return 'notepad';
  if (['ps1', 'bat', 'cmd', 'sh'].includes(ext)) return 'terminal';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  if (['zip', 'rar', '7z'].includes(ext)) return 'zip';
  if (['exe', 'msi'].includes(ext)) return 'windows';
  if (['mp3', 'wav', 'flac', 'm4a', 'ogg'].includes(ext)) return 'media';
  if (['mp4', 'mkv', 'mov', 'webm', 'avi'].includes(ext)) return 'videos';
  if (['csv', 'json', 'log'].includes(ext)) return 'documents';
  if (ext === 'pdf') return 'doc';
  if (['doc', 'docx', 'rtf'].includes(ext)) return 'doc';
  return 'file';
}

export function typeLabel(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = { txt: 'Text Document', png: 'PNG image', jpg: 'JPEG image', jpeg: 'JPEG image', md: 'Markdown source file', json: 'JSON file', zip: 'Compressed (zipped) Folder', exe: 'Application', ps1: 'PowerShell script', bat: 'Windows Batch File', log: 'Log file', doc: 'Document' };
  return map[ext] || (name.includes('.') ? `${ext.toUpperCase()} file` : 'File');
}
