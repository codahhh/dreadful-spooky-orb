/* ============================================================
   Groove Music
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc } from '../utils.js';
import { notify } from '../notify.js';

export const meta = { id: 'media', name: 'Groove Music', icon: 'media' };

const TRACKS = [
  { title: 'Spooky Orb (Main Theme)', artist: 'Dreadful Systems', length: 214 },
  { title: 'Taskbar Dreams', artist: 'The Pinned Five', length: 187 },
  { title: 'Ctrl + Shift + Esc', artist: 'Blue Screen Choir', length: 245 },
  { title: 'Aero Snap', artist: 'Dreadful Systems', length: 168 },
  { title: 'Night Light', artist: 'Amber Hours', length: 232 },
  { title: 'Recycle Bin Waltz', artist: 'The Restored', length: 199 },
];

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function launch() {
  const win = createWindow({
    title: 'Groove Music', icon: 'media', width: 760, height: 620,
    minWidth: 480, minHeight: 420, appId: 'media', instanceKey: 'media',
  });

  let idx = 0;
  let playing = false;
  let pos = 0;
  let vizTimer = null;
  let playTimer = null;

  win.body.innerHTML = `
    <div class="music">
      <div style="display:flex;align-items:center;gap:10px;font-size:12px;opacity:.7">
        <span style="width:16px;height:16px;display:inline-flex">${icon('media')}</span> Groove Music
        <span style="margin-left:auto;opacity:.6">Now playing</span>
      </div>
      <div class="music-top">
        <div class="music-art">${icon('media')}</div>
        <div class="music-meta">
          <h3 id="mu-title"></h3>
          <div id="mu-artist"></div>
          <div style="margin-top:8px;font-size:11px;opacity:.5">Streaming from the local void</div>
        </div>
      </div>
      <div class="music-viz" id="mu-viz"></div>
      <div class="music-progress">
        <span id="mu-pos">0:00</span>
        <div class="bar"><div id="mu-bar"></div></div>
        <span id="mu-len">0:00</span>
      </div>
      <div class="music-controls">
        <button id="mu-prev" title="Previous">${icon('prev')}</button>
        <button class="play" id="mu-play" title="Play">${icon('play')}</button>
        <button id="mu-next" title="Next">${icon('next')}</button>
      </div>
      <div class="music-list" id="mu-list"></div>
    </div>`;

  const viz = win.body.querySelector('#mu-viz');
  viz.innerHTML = Array.from({ length: 42 }, () => '<i></i>').join('');
  const bars = [...viz.querySelectorAll('i')];

  function renderTrack() {
    const t = TRACKS[idx];
    win.body.querySelector('#mu-title').textContent = t.title;
    win.body.querySelector('#mu-artist').textContent = t.artist;
    win.body.querySelector('#mu-len').textContent = mmss(t.length);
    win.setTitle(`${t.title} — Groove Music`);
    win.body.querySelector('#mu-list').innerHTML = TRACKS.map((tr, i) => `
      <div class="row${i === idx ? ' active' : ''}" data-track="${i}">
        <span>${i === idx && playing ? '▶ ' : ''}${esc(tr.title)}<span style="opacity:.5"> · ${esc(tr.artist)}</span></span>
        <span style="opacity:.5">${mmss(tr.length)}</span>
      </div>`).join('');
    win.body.querySelectorAll('[data-track]').forEach((r) => r.addEventListener('click', () => {
      idx = +r.dataset.track; pos = 0; play(); renderTrack();
    }));
    updateProgress();
  }

  function updateProgress() {
    const t = TRACKS[idx];
    win.body.querySelector('#mu-pos').textContent = mmss(pos);
    win.body.querySelector('#mu-bar').style.width = Math.min(100, (pos / t.length) * 100) + '%';
  }

  function animateViz() {
    bars.forEach((b, i) => {
      const h = playing ? 8 + Math.abs(Math.sin(Date.now() / 220 + i * 0.6)) * (60 + Math.random() * 40) : 6;
      b.style.height = h + '%';
      b.style.opacity = playing ? 0.95 : 0.3;
    });
  }

  function play() {
    playing = true;
    win.body.querySelector('#mu-play').innerHTML = icon('pause');
    clearInterval(playTimer);
    playTimer = setInterval(() => {
      pos += 0.25;
      if (pos >= TRACKS[idx].length) { next(); return; }
      updateProgress();
    }, 250);
    renderTrack();
  }

  function pause() {
    playing = false;
    win.body.querySelector('#mu-play').innerHTML = icon('play');
    clearInterval(playTimer);
    renderTrack();
  }

  function next() {
    idx = (idx + 1) % TRACKS.length;
    pos = 0;
    if (playing) { renderTrack(); } else renderTrack();
    updateProgress();
  }

  win.body.querySelector('#mu-play').addEventListener('click', () => { playing ? pause() : play(); });
  win.body.querySelector('#mu-next').addEventListener('click', () => next());
  win.body.querySelector('#mu-prev').addEventListener('click', () => { idx = (idx - 1 + TRACKS.length) % TRACKS.length; pos = 0; renderTrack(); updateProgress(); });

  vizTimer = setInterval(animateViz, 110);
  win.onBeforeClose = () => { clearInterval(vizTimer); clearInterval(playTimer); return true; };

  renderTrack();
  animateViz();
  return win;
}
