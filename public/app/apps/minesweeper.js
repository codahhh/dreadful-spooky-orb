/* ============================================================
   Minesweeper
   ============================================================ */

import { createWindow } from '../wm.js';
import { notify } from '../notify.js';
import { state, save } from '../store.js';

export const meta = { id: 'minesweeper', name: 'Minesweeper', icon: 'mine' };

const DIFFS = {
  beginner: { cols: 9, rows: 9, mines: 10 },
  intermediate: { cols: 16, rows: 16, mines: 40 },
  expert: { cols: 22, rows: 16, mines: 70 },
};

export function launch() {
  const win = createWindow({
    title: 'Minesweeper', icon: 'mine', width: 420, height: 500,
    minWidth: 320, minHeight: 380, appId: 'minesweeper',
  });

  let diff = 'beginner';
  let cfg = DIFFS[diff];
  let grid = [];
  let revealed = 0;
  let flags = 0;
  let started = false;
  let over = false;
  let time = 0;
  let timer = null;
  let firstClick = true;

  win.body.innerHTML = `
    <div class="mine">
      <div class="mine-panel">
        <div class="mine-head">
          <div class="lcd" id="ms-mines">010</div>
          <button class="mine-smiley" id="ms-reset" title="New game">🙂</button>
          <div class="lcd" id="ms-time">000</div>
        </div>
        <div class="mine-grid" id="ms-grid"></div>
      </div>
      <div class="mine-msg" id="ms-msg"></div>
      <div class="mine-foot">Left click to reveal · Right click to flag<br>Choose difficulty from the menu bar</div>
    </div>`;
  const gridEl = win.body.querySelector('#ms-grid');
  const msg = win.body.querySelector('#ms-msg');
  const minesEl = win.body.querySelector('#ms-mines');
  const timeEl = win.body.querySelector('#ms-time');

  function idx(x, y) { return y * cfg.cols + x; }

  function reset(d = diff) {
    diff = d;
    cfg = DIFFS[diff];
    clearInterval(timer);
    grid = [];
    revealed = 0; flags = 0; started = false; over = false; time = 0; firstClick = true;
    for (let y = 0; y < cfg.rows; y++) {
      for (let x = 0; x < cfg.cols; x++) {
        grid.push({ x, y, mine: false, open: false, flag: false, n: 0 });
      }
    }
    minesEl.textContent = String(cfg.mines).padStart(3, '0');
    timeEl.textContent = '000';
    msg.textContent = '';
    gridEl.style.gridTemplateColumns = `repeat(${cfg.cols}, 26px)`;
    win.body.querySelector('#ms-reset').textContent = '🙂';
    render();
  }

  function plant(sx, sy) {
    const safe = new Set([idx(sx, sy)]);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = sx + dx, y = sy + dy;
      if (x >= 0 && y >= 0 && x < cfg.cols && y < cfg.rows) safe.add(idx(x, y));
    }
    let placed = 0;
    while (placed < cfg.mines) {
      const i = Math.floor(Math.random() * grid.length);
      if (grid[i].mine || safe.has(i)) continue;
      grid[i].mine = true; placed++;
    }
    grid.forEach((c) => {
      if (c.mine) return;
      c.n = neighbors(c).filter((n) => n.mine).length;
    });
  }

  function neighbors(c) {
    const out = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const x = c.x + dx, y = c.y + dy;
      if (x >= 0 && y >= 0 && x < cfg.cols && y < cfg.rows) out.push(grid[idx(x, y)]);
    }
    return out;
  }

  function uncover(c) {
    if (c.open || c.flag || over) return;
    c.open = true;
    revealed++;
    if (c.mine) { lose(c); return; }
    if (c.n === 0) neighbors(c).forEach(uncover);
  }

  function lose(hit) {
    over = true;
    clearInterval(timer);
    win.body.querySelector('#ms-reset').textContent = '😵';
    grid.forEach((c) => { if (c.mine) c.open = true; });
    hit.hit = true;
    msg.textContent = 'Boom! Click the face to try again.';
    msg.style.color = '#8a1010';
    render();
    notify({ title: 'Minesweeper', body: 'You hit a mine. The orb remains undefeated.', icon: 'mine' });
  }

  function checkWin() {
    if (revealed === cfg.cols * cfg.rows - cfg.mines) {
      over = true;
      clearInterval(timer);
      win.body.querySelector('#ms-reset').textContent = '😎';
      msg.textContent = `Cleared in ${time}s!`;
      msg.style.color = '#0a5d0a';
      state.minesweeperBest = Math.min(state.minesweeperBest || 9999, time);
      save();
      notify({ title: 'Minesweeper', body: `Field cleared in ${time} seconds.`, icon: 'mine' });
    }
  }

  function render() {
    gridEl.innerHTML = grid.map((c, i) => {
      const cls = 'cell' + (c.open ? ' open' : '') + (c.open && c.mine ? ' mine-hit' : '') + (c.n ? ' c' + c.n : '');
      if (c.flag && !c.open) return `<div class="${cls} flag" data-i="${i}">🚩</div>`;
      if (!c.open) return `<div class="${cls}" data-i="${i}"></div>`;
      if (c.mine) return `<div class="${cls}" data-i="${i}">💣</div>`;
      return `<div class="${cls}" data-i="${i}">${c.n || ''}</div>`;
    }).join('');
    gridEl.querySelectorAll('.cell').forEach((cell) => {
      cell.addEventListener('click', () => click(+cell.dataset.i));
      cell.addEventListener('contextmenu', (e) => { e.preventDefault(); flag(+cell.dataset.i); });
    });
  }

  function click(i) {
    if (over) return;
    const c = grid[i];
    if (c.flag || c.open) return;
    if (firstClick) {
      plant(c.x, c.y);
      firstClick = false;
      started = true;
      timer = setInterval(() => { time = Math.min(999, time + 1); timeEl.textContent = String(time).padStart(3, '0'); }, 1000);
    }
    if (c.mine) { lose(c); return; }
    uncover(c);
    if (c.n === 0) {
      // flood already handled
    }
    render();
    checkWin();
  }

  function flag(i) {
    if (over) return;
    const c = grid[i];
    if (c.open) return;
    c.flag = !c.flag;
    flags += c.flag ? 1 : -1;
    minesEl.textContent = String(Math.max(0, cfg.mines - flags)).padStart(3, '0');
    render();
  }

  win.body.querySelector('#ms-reset').addEventListener('click', () => reset());

  // difficulty menu bar via right click on the panel
  win.body.querySelector('.mine-foot').addEventListener('click', () => {});
  win.body.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.cell')) return;
    e.preventDefault();
    import('../contextmenu.js').then(({ openMenu }) => {
      openMenu(e.clientX, e.clientY, [
        { label: 'Beginner (9×9, 10 mines)', checked: diff === 'beginner', action: () => reset('beginner') },
        { label: 'Intermediate (16×16, 40)', checked: diff === 'intermediate', action: () => reset('intermediate') },
        { label: 'Expert (22×16, 70)', checked: diff === 'expert', action: () => reset('expert') },
        'sep',
        { label: 'New game', icon: 'refresh', action: () => reset() },
      ]);
    });
  });

  reset();
  win.onBeforeClose = () => { clearInterval(timer); return true; };
  return win;
}
