/* ============================================================
   Toast notifications + notification history
   ============================================================ */

import { icon } from './icons.js';
import { el, bus, esc } from './utils.js';
import { state, pushNotification, save } from './store.js';

const host = () => document.getElementById('toast-host');

export function notify({ title = 'Windows', body = '', icon: ic = 'windows', timeout = 5200, onClick = null, silentHistory = false } = {}) {
  if (!silentHistory) {
    pushNotification({ title, body, icon: ic });
    bus.emit('notif:changed');
  }
  const toast = el('div', { class: 'toast' });
  toast.innerHTML = `
    <div class="t-ico">${icon(ic)}</div>
    <div class="t-main"><div class="t-title">${esc(title)}</div><div class="t-msg">${esc(body)}</div></div>
    <button class="t-x" title="Dismiss">${icon('close')}</button>`;
  const dismiss = () => {
    if (toast.classList.contains('out')) return;
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 220);
  };
  toast.querySelector('.t-x').addEventListener('click', (e) => { e.stopPropagation(); dismiss(); });
  toast.addEventListener('click', () => { onClick?.(); dismiss(); });
  host().append(toast);
  if (timeout) setTimeout(dismiss, timeout);
  return { dismiss };
}

export function clearAllNotifications() {
  state.notifications = [];
  save();
  bus.emit('notif:changed');
}
