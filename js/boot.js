/* ============================================================
   Boot, lock screen, sign-in, sleep / restart / shutdown
   ============================================================ */

import { icon } from './icons.js';
import { el, bus, sleep, $, pad2 } from './utils.js';
import { state, applySettings } from './store.js';
import { allWindows } from './wm.js';
import { notify } from './notify.js';

let lockTimer = null;
let signedIn = false;

function spinner() {
  return el('div', { class: 'win-spinner' }, ...[1, 2, 3, 4, 5].map(() => el('span', {})));
}

export function startBoot() {
  const boot = el('div', { id: 'boot-screen' });
  boot.innerHTML = `
    <div class="boot-logo">
      <svg viewBox="0 0 24 24" width="72" height="72"><path fill="#fff" d="M3 5.6l7.6-1v7.1H3V5.6zm0 12.8v-6.2h7.6v7.1L3 18.4zm8.6 1.2V11.6H21v8.6l-9.4-.6zM11.6 4.4L21 3v8.6h-9.4V4.4z"/></svg>
    </div>`;
  boot.append(spinner());
  document.getElementById('screen').append(boot);
  setTimeout(() => {
    boot.classList.add('done');
    setTimeout(() => boot.remove(), 700);
    showLock(false);
  }, 1500);
}

function updateLockClock() {
  const now = new Date();
  const c = document.getElementById('lock-clock');
  const d = document.getElementById('lock-date');
  if (c) c.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  if (d) d.textContent = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
}

export function showLock(withSignin = true) {
  const ls = document.getElementById('lockscreen');
  ls.hidden = false;
  ls.classList.remove('signing', 'done');
  ls.classList.toggle('signin-open', !!withSignin);
  document.getElementById('signin').hidden = !withSignin;
  updateLockClock();
  clearInterval(lockTimer);
  lockTimer = setInterval(updateLockClock, 1000);
  document.getElementById('signin-name').textContent = state.settings.userName || 'Alex';
  document.getElementById('signin-avatar').textContent = (state.settings.userName || 'Alex')[0].toUpperCase();
  if (withSignin) setTimeout(() => document.getElementById('signin-pass')?.focus(), 120);
}

function showSignin() {
  const ls = document.getElementById('lockscreen');
  document.getElementById('signin').hidden = false;
  ls.classList.add('signin-open');
  document.getElementById('signin-pass').focus();
  ls.classList.remove('signing');
}

let signingIn = false;
async function signIn() {
  if (signingIn) return;
  signingIn = true;
  const ls = document.getElementById('lockscreen');
  ls.classList.add('signing');
  document.getElementById('signin').hidden = true;
  const wait = el('div', { style: { position: 'absolute', inset: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '22px', zIndex: '4' } });
  wait.innerHTML = `<div class="avatar" style="width:80px;height:80px;font-size:32px">${(state.settings.userName || 'A')[0].toUpperCase()}</div>
    <div style="font-size:17px;font-weight:300;letter-spacing:.2px">Welcome</div>`;
  wait.append(spinner());
  ls.append(wait);
  await sleep(1200);
  ls.classList.add('done');
  await sleep(420);
  ls.hidden = true;
  ls.classList.remove('signing');
  wait.remove();
  signingIn = false;
  document.getElementById('signin-pass').value = '';
  clearInterval(lockTimer);
  signedIn = true;
  bus.emit('session:unlocked');
  setTimeout(() => {
    notify({ title: 'Windows 10', body: 'Signed in as Alex. This entire desktop is real software — go break something.', icon: 'windows', timeout: 6500 });
  }, 500);
}

function signOut() {
  allWindows().forEach((w) => w.close());
  signedIn = false;
  showLock(true);
  document.getElementById('signin').hidden = false;
}

function goSleep() {
  const screenEl = document.getElementById('screen');
  const overlay = el('div', { id: 'sleep-overlay', style: { position: 'absolute', inset: '0', background: '#000', zIndex: '9400', display: 'grid', placeItems: 'center', color: '#555', fontSize: '12px', cursor: 'default' } });
  overlay.textContent = 'Sleeping — click to wake';
  overlay.addEventListener('click', async () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity .5s';
    await sleep(450);
    overlay.remove();
    showLock(true);
  });
  screenEl.append(overlay);
}

async function shutdown(mode) {
  const sd = document.getElementById('shutdown-screen');
  sd.hidden = false;
  sd.querySelector('.sd-text').textContent = mode === 'restart' ? 'Restarting' : 'Shutting down';
  await sleep(2200);
  if (mode === 'restart') { location.reload(); return; }
  sd.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:22px">
      <button id="power-on" style="width:76px;height:76px;border-radius:50%;border:2px solid rgba(255,255,255,.55);display:grid;place-items:center;color:#fff;opacity:.85">
        <span style="width:30px;height:30px;display:inline-flex">${icon('power')}</span>
      </button>
      <div class="sd-text">The PC is off</div>
      <div style="font-size:11.5px;color:#777">Click the power button to start again</div>
    </div>`;
  sd.querySelector('#power-on').addEventListener('click', () => location.reload());
  sd.style.cursor = 'default';
}

export function initSession() {
  const ls = document.getElementById('lockscreen');
  ls.addEventListener('click', (e) => {
    if (e.target.closest('.signin')) return;
    if (document.getElementById('signin').hidden) showSignin();
  });

  const pass = document.getElementById('signin-pass');
  pass.addEventListener('keydown', (e) => { if (e.key === 'Enter') signIn(); });
  document.getElementById('signin-go').addEventListener('click', signIn);

  document.addEventListener('keydown', (e) => {
    if (!ls.hidden && !document.getElementById('signin').hidden && e.key === 'Enter') {
      e.preventDefault();
      signIn();
    }
  });

  document.getElementById('shutdown-screen').hidden = true;

  bus.on('session:lock', () => { if (signedIn) showLock(false); });
  bus.on('session:signout', signOut);
  bus.on('session:sleep', goSleep);
  bus.on('power:action', (mode) => shutdown(mode));

  startBoot();
}
