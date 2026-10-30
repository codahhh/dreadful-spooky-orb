/* ============================================================
   Mail
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc, showDialog } from '../utils.js';
import { notify } from '../notify.js';

export const meta = { id: 'mail', name: 'Mail', icon: 'mail' };

const MESSAGES = [
  {
    from: 'Microsoft Account Team', email: 'account@microsoft.com', color: '#0a6ebd',
    subject: 'Welcome to Windows 10 (browser edition)',
    preview: 'Your PC is ready. Here are a few things to try first…',
    date: '09:41',
    body: `Hello Alex,<br><br>Your brand new PC is ready to go. Everything you see is running locally in your browser — no virtual machines, no remote desktops, just a <b>lot</b> of JavaScript.<br><br>Here are a few things worth trying:<br><br>• Drag a window to the top of the screen to maximise it, or to either edge to snap it.<br>• Press <b>Win + Tab</b> to see every open window at once.<br>• Right-click almost anything. The menus are real.<br>• Open PowerShell and type <b>neofetch</b>.<br><br>Enjoy your new computer,<br>The Windows Team`,
  },
  {
    from: 'Dreadful Spooky Orb', email: 'orb@spooky.local', color: '#744da9',
    subject: 'Regarding the strange glow near your taskbar',
    preview: 'We have received your report and are looking into it…',
    date: 'Yesterday',
    body: `Thank you for contacting us.<br><br>We have received your report regarding a <b>soft violet glow</b> observed near the taskbar after midnight.<br><br>Our engineers have inspected the wallpaper and found nothing unusual. The orb, however, has inspected our engineers and found them delightful.<br><br>Please do not attempt to remove the orb. It is load-bearing.<br><br>Kind regards,<br>Facilities Management`,
  },
  {
    from: 'Minesweeper Championship', email: 'events@minesweeper.org', color: '#c25a2c',
    subject: 'Your invitation to the 2025 finals',
    preview: 'Congratulations! Your beginner record qualified…',
    date: 'Mon',
    body: `Congratulations, Alex!<br><br>Your beginner-level time has qualified you for the regional finals. Please bring your own mouse and an unreasonable amount of patience.<br><br>The 1-2-1 pattern will be tested.<br><br>See you there,<br>The Committee`,
  },
  {
    from: 'Windows Update', email: 'update@windows.local', color: '#0f7a4d',
    subject: 'Your device is up to date',
    preview: 'No action is required. We just wanted to say hello.',
    date: 'Mon',
    body: `Your PC is up to date.<br><br>There is nothing to install and nothing to restart. This is a rare and precious moment, so we thought we would write.<br><br>— Windows Update`,
  },
];

export function launch() {
  const win = createWindow({
    title: 'Inbox - Mail', icon: 'mail', width: 900, height: 600,
    minWidth: 540, minHeight: 340, appId: 'mail', instanceKey: 'mail',
  });

  let selected = 0;
  const read = new Set([1]);

  function render() {
    const m = MESSAGES[selected];
    win.body.innerHTML = `
      <div class="mail">
        <div class="mail-list">
          <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--line)">
            <button class="btn primary" style="height:26px;padding:0 12px;font-size:11.5px" id="mail-new">${icon('edit')} New mail</button>
            <span style="margin-left:auto;font-size:11px;color:var(--muted)">${MESSAGES.length - read.size} unread</span>
          </div>
          ${MESSAGES.map((msg, i) => `<div class="mail-item${i === selected ? ' active' : ''}" data-i="${i}">
            <div class="av" style="background:${msg.color}">${msg.from[0]}</div>
            <div style="min-width:0;flex:1">
              <div style="display:flex;gap:6px;align-items:baseline"><b style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(msg.from)}</b><span style="font-size:10.5px;color:var(--muted)">${msg.date}</span></div>
              <div style="font-size:12px;${read.has(i) ? 'font-weight:400' : 'font-weight:600'}">${esc(msg.subject)}</div>
              <div class="s">${esc(msg.preview)}</div>
            </div>
            ${read.has(i) ? '' : '<span style="width:6px;height:6px;border-radius:50%;background:var(--accent);margin-top:8px;flex:0 0 6px"></span>'}
          </div>`).join('')}
        </div>
        <div class="mail-read">
          <h2>${esc(m.subject)}</h2>
          <div class="m-meta"><b>${esc(m.from)}</b> &lt;${m.email}&gt; · to Alex · ${m.date}</div>
          <div>${m.body}</div>
          <div style="margin-top:26px;display:flex;gap:8px">
            <button class="btn" id="mail-reply">Reply</button>
            <button class="btn" id="mail-forward">Forward</button>
            <button class="btn" id="mail-delete">Delete</button>
          </div>
        </div>
      </div>`;

    win.body.querySelectorAll('[data-i]').forEach((row) => row.addEventListener('click', () => {
      selected = +row.dataset.i;
      read.add(selected);
      render();
    }));
    win.body.querySelector('#mail-new').addEventListener('click', compose);
    win.body.querySelector('#mail-reply').addEventListener('click', compose);
    win.body.querySelector('#mail-forward').addEventListener('click', compose);
    win.body.querySelector('#mail-delete').addEventListener('click', () => {
      MESSAGES.splice(selected, 1);
      selected = Math.max(0, selected - 1);
      if (!MESSAGES.length) { win.body.innerHTML = '<div class="exp-empty">' + icon('mail') + '<div>Your inbox is empty.</div></div>'; return; }
      render();
      notify({ title: 'Mail', body: 'Message deleted.', icon: 'mail' });
    });
    win.setTitle(`${m.subject} - Mail`);
  }

  function compose() {
    showDialog({
      title: 'New message',
      body: `<div style="display:flex;flex-direction:column;gap:8px">
        <input type="text" placeholder="To" value="orb@spooky.local" style="height:28px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:0 8px">
        <input type="text" placeholder="Subject" style="height:28px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:0 8px">
        <textarea placeholder="Write a message…" style="height:120px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:8px;resize:none;font:inherit"></textarea>
      </div>`,
      buttons: [{ id: 'cancel', label: 'Cancel' }, { id: 'send', label: 'Send', primary: true }],
      width: 520,
    }).then((r) => {
      if (r === 'send') notify({ title: 'Mail', body: 'Your message was sent to the void. The void says thanks.', icon: 'mail' });
    });
  }

  render();
  return win;
}
