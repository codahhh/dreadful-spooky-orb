/* ============================================================
   Task Manager
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc, fmtBytes } from '../utils.js';
import { allWindows, focusedWindow } from '../wm.js';
import { allApps } from './registry.js';
import { notify } from '../notify.js';

export const meta = { id: 'taskmanager', name: 'Task Manager', icon: 'taskmgr' };

const SYSTEM = [
  ['System', 'system', 0.3, 1.1, 148],
  ['Registry', 'settings2', 0, 0.6, 32],
  ['smss.exe', 'terminal', 0, 0.1, 1.2],
  ['csrss.exe', 'terminal', 0.2, 1.6, 4.6],
  ['wininit.exe', 'terminal', 0, 0.2, 3.1],
  ['services.exe', 'settings2', 0.1, 0.9, 6.4],
  ['lsass.exe', 'shield', 0.4, 1.4, 12.8],
  ['svchost.exe (NetworkService)', 'globe', 0.7, 2.2, 24.6],
  ['dwm.exe', 'display', 2.6, 2.8, 62.1],
  ['explorer.exe', 'folder', 1.4, 1.9, 84.2],
  ['SearchApp.exe', 'search', 0.6, 1.2, 42.7],
  ['StartMenuExperienceHost.exe', 'windows', 0.2, 0.7, 26.4],
  ['RuntimeBroker.exe', 'apps', 0.3, 0.5, 18.3],
  ['TextInputHost.exe', 'keyboard', 0.1, 0.9, 12.1],
  ['Taskmgr.exe', 'taskmgr', 0.6, 1.1, 14.2],
];

export function launch(args = {}) {
  const win = createWindow({
    title: 'Task Manager', icon: 'taskmgr', width: 840, height: 620,
    minWidth: 560, minHeight: 380, appId: 'taskmanager',
  });

  let tab = args.tab || 'processes';
  let selected = null;
  let timer = null;
  let graphs = [];
  let metrics = { cpu: 8, mem: 42, disk: 3, net: 12 };
  const cpuHist = Array.from({ length: 60 }, () => 6 + Math.random() * 14);
  const memHist = Array.from({ length: 60 }, () => 40 + Math.random() * 8);

  win.body.innerHTML = `
    <div class="tm">
      <div class="tm-tabs">
        <button class="tm-tab" data-tab="processes">Processes</button>
        <button class="tm-tab" data-tab="performance">Performance</button>
        <button class="tm-tab" data-tab="startup">Startup</button>
        <button class="tm-tab" data-tab="users">Users</button>
      </div>
      <div class="tm-main" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>
    </div>`;

  const main = win.body.querySelector('.tm-main');

  function windowsProcesses() {
    return allWindows().filter((w) => !w.closed).map((w) => {
      const app = allApps().find((a) => a.id === w.appId);
      return { name: `${app?.name || w.appId}.exe`, title: w.title, icon: app?.icon || 'file', cpu: (Math.random() * 2.4).toFixed(1), mem: (40 + Math.random() * 220), win: w, user: 'Alex' };
    });
  }

  function renderProcesses() {
    main.innerHTML = `
      <div class="tm-head"><span class="tm-name">Name</span><span class="tm-cpu">CPU</span><span class="tm-mem">Memory</span><span style="width:120px;text-align:right;padding-right:6px">Status</span></div>
      <div class="tm-body" id="tm-body"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;padding:8px 12px;border-top:1px solid var(--line)">
        <button class="btn" id="tm-end">End task</button>
      </div>`;
    refreshProcessList();
  }

  function refreshProcessList() {
    const body = main.querySelector('#tm-body');
    if (!body) return;
    const procs = windowsProcesses();
    const rows = [
      ...procs.map((p) => ({ ...p, group: 'Apps' })),
      ...SYSTEM.map(([name, ico, cpu, m, mem]) => ({ name, icon: ico, cpu: (cpu + Math.random()).toFixed(1), mem, group: 'Background processes', sys: true })),
    ];
    body.innerHTML = '';
    ['Apps', 'Background processes'].forEach((group) => {
      body.append(el('div', { style: 'padding:6px 12px;font-size:11px;color:var(--muted);background:var(--win-bg-alt);border-bottom:1px solid var(--line)', text: group }));
      rows.filter((r) => r.group === group).forEach((p, i) => {
        const row = el('div', { class: 'tm-row', dataset: { i: String(i) } });
        const memMB = p.mem;
        row.innerHTML = `<span class="tm-name"><span style="width:16px;height:16px;display:inline-flex">${icon(p.icon || 'file')}</span><span>${esc(p.name)}</span></span>
          <span class="tm-cpu">${p.cpu}%</span><span class="tm-mem">${memMB > 0 ? memMB.toFixed(1) + ' MB' : '0 MB'}</span>
          <span style="width:120px;text-align:right;padding-right:6px;font-size:11px;color:var(--muted)">${p.win ? 'Running' : 'Running'}</span>`;
        row.addEventListener('click', () => {
          body.querySelectorAll('.tm-row').forEach((r) => r.classList.remove('selected'));
          row.classList.add('selected');
          selected = p;
        });
        row.addEventListener('dblclick', () => { if (p.win) { p.win.restore(); p.win.focus(); } });
        row.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          import('../contextmenu.js').then(({ openMenu }) => openMenu(e.clientX, e.clientY, [
            { label: 'Switch to', icon: 'open', disabled: !p.win, action: () => { p.win?.restore(); p.win?.focus(); } },
            { label: 'End task', icon: 'close', disabled: !p.win, action: () => { p.win?.close(); refreshProcessList(); } },
            'sep',
            { label: 'Properties', icon: 'properties', action: () => notify({ title: p.name, body: `Working set: ${memMB.toFixed(1)} MB\nCPU: ${p.cpu}%\nUser: ${p.user || 'SYSTEM'}`, icon: 'taskmgr' }) },
          ]));
        });
        if (p.win) row.style.fontWeight = '400';
        body.append(row);
      });
    });
  }

  main.querySelector('.tm-tabs')?.addEventListener('click', () => {});

  function renderPerformance() {
    main.innerHTML = `
      <div class="tm-perf">
        <div style="display:flex;flex-direction:column;gap:12px;width:52%;min-width:0">
          <div class="graph"><b>CPU · ${metrics.cpu}%</b><span style="font-size:11px;color:var(--muted)">Dreadful Spooky Orb CPU @ 3.60 GHz</span><canvas id="cpu-graph"></canvas></div>
          <div class="graph"><b>Memory · ${metrics.mem}%</b><span style="font-size:11px;color:var(--muted)">6.2/16.0 GB (39%)</span><canvas id="mem-graph"></canvas></div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:10px;font-size:12px">
          <div class="graph" style="flex:none"><b style="margin-bottom:6px;display:block">Details</b>
            <div class="set-kv" style="grid-template-columns:110px 1fr;font-size:11.5px">
              <dt>Uptime</dt><dd>0:${String(Math.floor(performance.now() / 1000) % 60).padStart(2, '0')}:${String(Math.floor(performance.now() / 1000) % 60).padStart(2, '0')}</dd>
              <dt>Processes</dt><dd>${windowsProcesses().length + SYSTEM.length}</dd>
              <dt>Threads</dt><dd>2,148</dd>
              <dt>Handles</dt><dd>68,432</dd>
              <dt>Sockets</dt><dd>128</dd>
            </div>
          </div>
          <div class="graph" style="flex:none"><b style="display:block;margin-bottom:6px">Disk 0 (C:) · 3%</b>
            <div style="height:56px;border:1px solid var(--line);border-radius:3px;display:flex;align-items:flex-end;gap:2px;padding:4px" id="disk-bars"></div>
          </div>
          <div class="graph" style="flex:none"><b style="display:block;margin-bottom:6px">Ethernet · 12 kbps</b>
            <div style="font-size:11px;color:var(--muted);line-height:1.7">Adapter: Orb Virtual Ethernet<br>IPv4: 192.168.1.42<br>Link speed: 1.0 Gbps</div>
          </div>
        </div>
      </div>`;
    const cpuCanvas = main.querySelector('#cpu-graph');
    const memCanvas = main.querySelector('#mem-graph');
    drawGraph(cpuCanvas, cpuHist, '#0078d7');
    drawGraph(memCanvas, memHist, '#8764b8');
    const diskBars = main.querySelector('#disk-bars');
    diskBars.innerHTML = Array.from({ length: 30 }, () => `<i style="flex:1;background:var(--accent);opacity:.7;height:${5 + Math.random() * 60}%"></i>`).join('');
  }

  function drawGraph(canvas, data, color) {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(10, rect.width) * dpr;
    canvas.height = Math.max(10, rect.height) * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(128,128,128,.18)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(0, (h / 5) * i); ctx.lineTo(w, (h / 5) * i); ctx.stroke();
    }
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / 100) * h;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + '55');
    grad.addColorStop(1, color + '05');
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function renderStartup() {
    const items = [
      ['Microsoft OneDrive', 'Low impact', 'onedrive', true],
      ['Windows Security notification icon', 'Low impact', 'shield', true],
      ['Spooky Orb Helper', 'High impact', 'windows', false],
      ['Adobe Creative Cloud', 'Medium impact', 'paint', false],
      ['Discord', 'Medium impact', 'media', false],
      ['Microsoft Edge', 'Low impact', 'edge', true],
    ];
    main.innerHTML = `
      <div class="tm-head"><span class="tm-name">Name</span><span style="width:160px">Publisher</span><span style="width:120px">Status</span><span style="width:90px;text-align:right">Startup impact</span></div>
      <div class="tm-body">
        ${items.map(([name, impact, ico, enabled], i) => `<div class="tm-row">
          <span class="tm-name"><span style="width:16px;height:16px;display:inline-flex">${icon(ico)}</span><span>${name}</span></span>
          <span style="width:160px;color:var(--muted);font-size:11.5px">Dreadful Systems</span>
          <span style="width:120px"><button class="btn" style="height:22px;padding:0 10px;font-size:11px" data-tog="${i}">${enabled ? 'Enabled' : 'Disabled'}</button></span>
          <span style="width:90px;text-align:right;color:${impact === 'High impact' ? '#c0261a' : 'var(--muted)'};font-size:11.5px">${impact}</span>
        </div>`).join('')}
      </div>
      <div style="display:flex;justify-content:flex-end;padding:8px 12px;border-top:1px solid var(--line)"><button class="btn">Disable all</button></div>`;
    main.querySelectorAll('[data-tog]').forEach((b) => b.addEventListener('click', () => {
      b.textContent = b.textContent === 'Enabled' ? 'Disabled' : 'Enabled';
    }));
  }

  function renderUsers() {
    main.innerHTML = `<div class="tm-body">
      <div class="tm-row"><span class="tm-name"><span style="width:22px;height:22px;display:inline-flex">${icon('user', 22)}</span><span><b>${esc((JSON.parse(localStorage.getItem('win10os.state.v1') || '{}').settings || {}).userName || 'Alex')}</b><div style="font-size:11px;color:var(--muted)">Local account · Active</div></span></span><span style="width:120px;color:var(--muted)">2.4% CPU</span><span style="width:120px;color:var(--muted)">6.2 GB</span></div>
      <div class="tm-row"><span class="tm-name"><span style="width:22px;height:22px;display:inline-flex">${icon('user', 22)}</span><span><b>SYSTEM</b><div style="font-size:11px;color:var(--muted)">System services</div></span></span><span style="width:120px;color:var(--muted)">0.8% CPU</span><span style="width:120px;color:var(--muted)">0.4 GB</span></div>
    </div>
    <div style="display:flex;justify-content:flex-end;padding:8px 12px;border-top:1px solid var(--line)"><button class="btn">Sign off</button></div>`;
  }

  function render() {
    win.body.querySelectorAll('.tm-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'processes') renderProcesses();
    else if (tab === 'performance') renderPerformance();
    else if (tab === 'startup') renderStartup();
    else renderUsers();
  }

  win.body.querySelectorAll('.tm-tab').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
  win.body.querySelector('.tm-main')?.addEventListener('click', () => {});

  // delegated end-task button
  win.body.addEventListener('click', (e) => {
    if (e.target.id === 'tm-end') {
      if (!selected || !selected.win) { notify({ title: 'Task Manager', body: 'Select an app you can end (background processes are protected).', icon: 'taskmgr' }); return; }
      selected.win.close();
      selected = null;
      refreshProcessList();
    }
  });

  render();

  timer = setInterval(() => {
    metrics.cpu = Math.max(2, Math.min(99, metrics.cpu + (Math.random() - 0.5) * 14));
    metrics.mem = Math.max(30, Math.min(80, metrics.mem + (Math.random() - 0.5) * 2));
    cpuHist.push(metrics.cpu); cpuHist.shift();
    memHist.push(metrics.mem); memHist.shift();
    if (tab === 'performance') {
      const b = main.querySelector('.graph b');
      if (b) b.textContent = `CPU · ${metrics.cpu.toFixed(0)}%`;
      drawGraph(main.querySelector('#cpu-graph'), cpuHist, '#0078d7');
      drawGraph(main.querySelector('#mem-graph'), memHist, '#8764b8');
    } else if (tab === 'processes') {
      refreshProcessList();
    }
  }, 1600);

  win.onBeforeClose = () => { clearInterval(timer); return true; };
  return win;
}
