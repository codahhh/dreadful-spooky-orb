/* ============================================================
   Groove Music
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc } from '../utils.js';
import { notify } from '../notify.js';

export const meta = { id: 'media', name: 'Groove Music', icon: 'media' };

const TRACKS = [
  { title: 'Spooky Orb (Main Theme)', artist: 'Dreadful Systems', album: 'Orb', length: 214, art: ['#3b1e7a', '#7b47ff'] },
  { title: 'Taskbar Dreams', artist: 'The Pinned Five', album: 'Shell', length: 187, art: ['#0a3d62', '#1e90ff'] },
  { title: 'Ctrl + Shift + Esc', artist: 'Blue Screen Choir', album: 'Fatal', length: 245, art: ['#0b1b7a', '#2b6cff'] },
  { title: 'Aero Snap', artist: 'Dreadful Systems', album: 'Orb', length: 168, art: ['#0d5c4a', '#12f7d6'] },
  { title: 'Night Light', artist: 'Amber Hours', album: 'Amber', length: 232, art: ['#5b2a06', '#ff9e64'] },
  { title: 'Recycle Bin Waltz', artist: 'The Restored', album: 'Deleted', length: 199, art: ['#2b2b31', '#8b98a6'] },
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
  let shuffle = false;
  let repeat = false;
  let muted = false;
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
        <button id="mu-shuffle" title="Shuffle" style="opacity:.6">${icon('sort')}</button>
        <button id="mu-prev" title="Previous">${icon('prev')}</button>
        <button class="play" id="mu-play" title="Play">${icon('play')}</button>
        <button id="mu-next" title="Next">${icon('next')}</button>
        <button id="mu-repeat" title="Repeat" style="opacity:.6">${icon('refresh')}</button>
        <button id="mu-vol" title="Mute" style="margin-left:auto;opacity:.7">${icon('volume')}</button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;font-size:11px;opacity:.6;margin-top:2px">
        <span id="mu-count"></span><span style="margin-left:auto" id="mu-mode"></span>
      </div>
      <div class="music-list" id="mu-list"></div>
    </div>`;

  const viz = win.body.querySelector('#mu-viz');
  viz.innerHTML = Array.from({ length: 42 }, () => '<i></i>').join('');
  const bars = [...viz.querySelectorAll('i')];

  function renderTrack() {
    const t = TRACKS[idx];
    win.body.querySelector('#mu-title').textContent = t.title;
    win.body.querySelector('#mu-artist').textContent = `${t.artist} · ${t.album}`;
    win.body.querySelector('#mu-len').textContent = mmss(t.length);
    win.body.querySelector('#mu-count').textContent = `${idx + 1} of ${TRACKS.length} · ${TRACKS.reduce((a, b) => a + b.length, 0) / 60 | 0} min total`;
    win.body.querySelector('#mu-mode').textContent = [shuffle ? 'shuffle on' : '', repeat ? 'repeat on' : ''].filter(Boolean).join(' · ') || 'in order';
    win.body.querySelector('#mu-shuffle').style.opacity = shuffle ? 1 : 0.6;
    win.body.querySelector('#mu-repeat').style.opacity = repeat ? 1 : 0.6;
    win.body.querySelector('#mu-vol').style.opacity = muted ? 0.35 : 0.7;
    const art = win.body.querySelector('.music-art');
    if (art) {
      art.style.background = `linear-gradient(135deg, ${t.art[0]}, ${t.art[1]})`;
      art.innerHTML = `<span style="width:46%;height:46%;display:flex;opacity:.9">${icon('media')}</span>`;
      art.style.display = 'grid';
      art.style.placeItems = 'center';
    }
    win.setTitle(`${t.title} — Groove Music`);
    win.body.querySelector('#mu-list').innerHTML = TRACKS.map((tr, i) => `
      <div class="row${i === idx ? ' active' : ''}" data-track="${i}">
        <span style="display:flex;align-items:center;gap:8px;min-width:0">
          <span style="width:20px;height:20px;flex:0 0 20px;border-radius:2px;background:linear-gradient(135deg,${tr.art[0]},${tr.art[1]})"></span>
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i === idx && playing ? '▶ ' : ''}${esc(tr.title)}<span style="opacity:.5"> · ${esc(tr.artist)}</span></span>
        </span>
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
      if (pos >= TRACKS[idx].length) { pos = 0; if (!repeat) next(); else { updateProgress(); } return; }
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
    if (shuffle) {
      let n = idx;
      while (n === idx && TRACKS.length > 1) n = Math.floor(Math.random() * TRACKS.length);
      idx = n; pos = 0;
      renderTrack(); updateProgress();
      return;
    }
    idx = (idx + 1) % TRACKS.length;
    pos = 0;
    if (playing) { renderTrack(); } else renderTrack();
    updateProgress();
  }

  win.body.querySelector('#mu-play').addEventListener('click', () => { playing ? pause() : play(); });
  win.body.querySelector('#mu-next').addEventListener('click', () => next());
  win.body.querySelector('#mu-prev').addEventListener('click', () => { idx = (idx - 1 + TRACKS.length) % TRACKS.length; pos = 0; renderTrack(); updateProgress(); });
  win.body.querySelector('#mu-shuffle').addEventListener('click', () => {
    shuffle = !shuffle;
    notify({ title: 'Groove Music', body: shuffle ? 'Shuffle is on.' : 'Shuffle is off.', icon: 'media', timeout: 2200 });
    renderTrack();
  });
  win.body.querySelector('#mu-repeat').addEventListener('click', () => {
    repeat = !repeat;
    notify({ title: 'Groove Music', body: repeat ? 'Repeat is on.' : 'Repeat is off.', icon: 'media', timeout: 2200 });
    renderTrack();
  });
  win.body.querySelector('#mu-vol').addEventListener('click', () => {
    muted = !muted;
    notify({ title: 'Groove Music', body: muted ? 'Muted. The silence is intentional.' : 'Unmuted.', icon: 'volume', timeout: 2200 });
    renderTrack();
  });

  vizTimer = setInterval(animateViz, 110);
  win.onBeforeClose = () => { clearInterval(vizTimer); clearInterval(playTimer); return true; };

  renderTrack();
  animateViz();
  return win;
}
