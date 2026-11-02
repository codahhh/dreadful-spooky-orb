/* ============================================================
   Calendar
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc, showDialog, MONTHS, DOW, pad2, bus } from '../utils.js';
import { state, save } from '../store.js';
import { notify } from '../notify.js';

export const meta = { id: 'calendar', name: 'Calendar', icon: 'calendar' };

const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };

function seedEvents() {
  if (state.calendarEvents) return;
  const t = todayISO();
  state.calendarEvents = [
    { date: t, time: '09:00', title: 'Windows Update — automatic restart', place: 'System' },
    { date: t, time: '11:30', title: 'Meeting: taskbar alignment debate', place: 'Microsoft Teams' },
    { date: t, time: '16:00', title: 'Minesweeper championship', place: 'Desktop' },
  ];
  save();
}

export function launch() {
  seedEvents();
  const win = createWindow({
    title: 'Calendar', icon: 'calendar', width: 860, height: 620,
    minWidth: 560, minHeight: 380, appId: 'calendar', instanceKey: 'calendar',
  });

  let view = new Date();
  view.setDate(1);
  let selected = todayISO();

  function render() {
    const y = view.getFullYear(), m = view.getMonth();
    const startDow = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const monthStart = `${y}-${pad2(m + 1)}-`;
    const today = todayISO();
    const events = state.calendarEvents || [];

    let cells = '';
    for (let i = 0; i < startDow; i++) cells += `<div style="height:74px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:4px;color:var(--muted);font-size:11px">${prevDays - startDow + i + 1}</div>`;
    for (let d = 1; d <= days; d++) {
      const iso = `${monthStart}${pad2(d)}`;
      const dayEvents = events.filter((e) => e.date === iso);
      const isToday = iso === today;
      const isSel = iso === selected;
      cells += `<div class="cal-cell" data-date="${iso}" style="height:74px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:4px 5px;overflow:hidden;${isSel ? 'background:rgba(0,120,215,.12);' : ''}">
        <div style="display:flex;justify-content:center"><span style="font-size:11.5px;${isToday ? 'background:var(--accent);color:#fff;border-radius:50%;width:22px;height:22px;display:grid;place-items:center' : ''}">${d}</span></div>
        ${dayEvents.slice(0, 2).map((e) => `<div style="font-size:10px;margin-top:2px;background:${isToday ? 'var(--accent)' : 'rgba(0,120,215,.18)'};color:${isToday ? '#fff' : 'inherit'};border-radius:2px;padding:1px 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.time} ${esc(e.title)}</div>`).join('')}
        ${dayEvents.length > 2 ? `<div style="font-size:9.5px;color:var(--muted);margin-top:2px">+${dayEvents.length - 2} more</div>` : ''}
      </div>`;
    }
    const total = startDow + days;
    for (let i = 0; i < (7 - (total % 7)) % 7; i++) cells += `<div style="height:74px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:4px;color:var(--muted);font-size:11px">${i + 1}</div>`;

    const dayEvents = events.filter((e) => e.date === selected).sort((a, b) => a.time.localeCompare(b.time));

    win.body.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%">
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line)">
          <b style="font-size:15px;font-weight:600">${MONTHS[m]} ${y}</b>
          <button class="tb-icon" id="cal-prev">${icon('back')}</button>
          <button class="tb-icon" id="cal-next">${icon('forward')}</button>
          <button class="tb-text" id="cal-today">Today</button>
          <div style="margin-left:auto;display:flex;gap:2px">
            <button class="tb-icon" title="Day">${icon('calendar')}</button>
            <button class="tb-icon" title="Week">${icon('view')}</button>
          </div>
          <button class="btn primary" id="cal-new" style="height:28px;font-size:11.5px">${icon('plus')} New event</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid var(--line);background:var(--win-bg-alt)">
          ${DOW.map((d, i) => `<div style="text-align:center;font-size:10.5px;color:var(--muted);padding:6px 0">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);flex:1;min-height:0;overflow:auto;border-left:1px solid var(--line)">${cells}</div>
        <div style="border-top:1px solid var(--line);max-height:150px;overflow:auto;padding:10px 14px">
          <div style="font-size:12px;font-weight:600;margin-bottom:6px">${new Date(selected + 'T12:00:00').toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          ${dayEvents.length ? dayEvents.map((e, i) => `<div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--line);font-size:12px">
            <span style="width:46px;color:var(--muted)">${e.time}</span>
            <span style="flex:1"><b style="font-weight:500">${esc(e.title)}</b><span style="color:var(--muted)"> · ${esc(e.place || '')}</span></span>
            <button class="tb-icon" data-del="${i}" style="width:20px;height:20px;color:var(--muted)">${icon('trash')}</button>
          </div>`).join('') : `<div style="font-size:12px;color:var(--muted)">No events. Enjoy the silence.</div>`}
        </div>
      </div>`;

    win.body.querySelectorAll('[data-date]').forEach((c) => c.addEventListener('click', () => { selected = c.dataset.date; render(); }));
    win.body.querySelector('#cal-prev').addEventListener('click', () => { view = new Date(y, m - 1, 1); render(); });
    win.body.querySelector('#cal-next').addEventListener('click', () => { view = new Date(y, m + 1, 1); render(); });
    win.body.querySelector('#cal-today').addEventListener('click', () => { const d = new Date(); view = new Date(d.getFullYear(), d.getMonth(), 1); selected = todayISO(); render(); });
    win.body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const ev = dayEvents[+b.dataset.del];
      state.calendarEvents = state.calendarEvents.filter((x) => x !== ev);
      save(); render();
      notify({ title: 'Calendar', body: 'Event deleted.', icon: 'calendar', timeout: 2400 });
    }));
    win.body.querySelector('#cal-new').addEventListener('click', async () => {
      const r = await showDialog({
        title: 'New event',
        body: `<div style="display:flex;flex-direction:column;gap:8px">
          <input id="ev-title" type="text" placeholder="Event title" style="height:28px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:0 8px">
          <div style="display:flex;gap:8px">
            <input id="ev-date" type="date" value="${selected}" style="flex:1;height:28px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:0 8px">
            <input id="ev-time" type="time" value="10:00" style="width:110px;height:28px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:0 8px">
          </div>
          <input id="ev-place" type="text" placeholder="Location (optional)" style="height:28px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:0 8px">
        </div>`,
        buttons: [{ id: 'cancel', label: 'Cancel' }, { id: 'ok', label: 'Save', primary: true }],
        width: 420,
      });
      if (r !== 'ok') return;
      const title = document.getElementById('ev-title')?.value.trim();
      if (!title) return;
      state.calendarEvents.push({
        date: document.getElementById('ev-date').value || selected,
        time: document.getElementById('ev-time').value || '10:00',
        title,
        place: document.getElementById('ev-place').value || '',
      });
      save(); render();
      bus.emit('calendar:changed');
      notify({ title: 'Calendar', body: `"${title}" added.`, icon: 'calendar' });
    });
    setTimeout(() => document.getElementById('ev-title')?.focus(), 30);
  }

  render();
  return win;
}
