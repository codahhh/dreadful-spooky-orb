/* ============================================================
   Mail
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { esc, showDialog } from '../utils.js';
import { notify } from '../notify.js';

export const meta = { id: 'mail', name: 'Mail', icon: 'mail' };

const MESSAGES = [
  {
    from: 'Microsoft Account Team', email: 'account@microsoft.com', color: '#0a6ebd',
    subject: 'Welcome to Windows 10 (browser edition)',
    preview: 'Your PC is ready. Here are a few things to try first…',
    date: '09:41', folder: 'inbox', flagged: true,
    body: `Hello Alex,<br><br>Your brand new PC is ready to go. Everything you see is running locally in your browser — no virtual machines, no remote desktops, just a <b>lot</b> of JavaScript.<br><br>Here are a few things worth trying:<br><br>• Drag a window to the top of the screen to maximise it, or to either edge to snap it.<br>• Press <b>Win + Tab</b> to see every open window at once.<br>• Right-click almost anything. The menus are real.<br>• Open PowerShell and type <b>neofetch</b>.<br><br>Enjoy your new computer,<br>The Windows Team`,
  },
  {
    from: 'Dreadful Spooky Orb', email: 'orb@spooky.local', color: '#744da9',
    subject: 'Regarding the strange glow near your taskbar',
    preview: 'We have received your report and are looking into it…',
    date: 'Yesterday', folder: 'inbox', flagged: true,
    body: `Thank you for contacting us.<br><br>We have received your report regarding a <b>soft violet glow</b> observed near the taskbar after midnight.<br><br>Our engineers have inspected the wallpaper and found nothing unusual. The orb, however, has inspected our engineers and found them delightful.<br><br>Please do not attempt to remove the orb. It is load-bearing.<br><br>Kind regards,<br>Facilities Management`,
  },
  {
    from: 'Minesweeper Championship', email: 'events@minesweeper.org', color: '#c25a2c',
    subject: 'Your invitation to the 2026 finals',
    preview: 'Congratulations! Your beginner record qualified…',
    date: 'Mon', folder: 'inbox',
    body: `Congratulations, Alex!<br><br>Your beginner-level time has qualified you for the regional finals. Please bring your own mouse and an unreasonable amount of patience.<br><br>The 1-2-1 pattern will be tested.<br><br>See you there,<br>The Committee`,
  },
  {
    from: 'Windows Update', email: 'update@windows.local', color: '#0f7a4d',
    subject: 'Your device is up to date',
    preview: 'No action is required. We just wanted to say hello.',
    date: 'Mon', folder: 'inbox',
    body: `Your PC is up to date.<br><br>There is nothing to install and nothing to restart. This is a rare and precious moment, so we thought we would write.<br><br>— Windows Update`,
  },
  {
    from: 'Facilities', email: 'facilities@spooky.local', color: '#b8860b',
    subject: 'Re: the orb is humming again',
    preview: 'It is probably nothing. It is probably also not nothing.',
    date: 'Tue', folder: 'inbox',
    body: `Alex,<br><br>The orb has started humming. We measured it at roughly 60 Hz, which is suspiciously close to your display refresh rate.<br><br>Please avoid opening more than twelve windows at once until this is resolved. Or do — we are not the police of windows.<br><br>— Facilities`,
  },
  {
    from: 'Groove Music', email: 'music@windows.local', color: '#0b7285',
    subject: 'Your 2026 listening summary',
    preview: 'You listened to "Spooky Orb (Main Theme)" 312 times…',
    date: 'Wed', folder: 'inbox',
    body: `Your year in music:<br><br>• 312 plays of <b>Spooky Orb (Main Theme)</b><br>• 4 minutes of silence in March<br>• Your top genre was "taskbar ambience"<br>• You skipped 0 songs, because the skip button is fictional<br><br>See you next year.`,
  },
  {
    from: 'Paint', email: 'paint@windows.local', color: '#5f3dc4',
    subject: 'You left something unsaved',
    preview: 'A 1024×768 canvas with a suspicious circle on it.',
    date: 'Thu', folder: 'inbox',
    body: `We noticed you closed Paint without saving.<br><br>The circle was quite good. We are not going to lie to you about the circle.<br><br>You can draw another one any time.`,
  },
  {
    from: 'Store Support', email: 'store@windows.local', color: '#1c7ed6',
    subject: 'Your download of Solitaire is 0% complete',
    preview: 'It has been 0% complete for a while now.',
    date: 'Fri', folder: 'inbox',
    body: `Your download of <b>Solitaire Collection</b> is stuck at 0%.<br><br>This is not a bug. The game is behind a portal and the portal has opinions.<br><br>Meanwhile, Minesweeper is right there.`,
  },
  {
    from: 'You', email: 'alex@windows.local', color: '#495057',
    subject: 'Re: Late-night noodles',
    preview: 'Sent from the composer in this very app.',
    date: 'Fri', folder: 'sent',
    body: `Sounds good. I will bring the chilli.<br><br>Sent from Mail for Windows 10 (browser build).`,
  },
  {
    from: 'Newsletter', email: 'digest@spooky.local', color: '#2f9e44',
    subject: 'This week in Windows: taskbar alignment debate',
    preview: 'Two factions. One taskbar. No compromise.',
    date: 'Sat', folder: 'archive',
    body: `This week's digest:<br><br>1. The left-or-centre taskbar debate enters its ninth year.<br>2. Someone set a new Minesweeper beginner record of 3 seconds. Suspected orb involvement.<br>3. The orb hummed again. Nobody panicked.<br><br>That's all.`,
  },
];

const FOLDERS = [
  ['inbox', 'Inbox'],
  ['unread', 'Unread'],
  ['flagged', 'Flagged'],
  ['sent', 'Sent'],
  ['archive', 'Archive'],
];

export function launch() {
  const win = createWindow({
    title: 'Inbox - Mail', icon: 'mail', width: 980, height: 640,
    minWidth: 520, minHeight: 340, appId: 'mail', instanceKey: 'mail',
  });

  let selected = 0;
  let folder = 'inbox';
  let query = '';
  const read = new Set([1]);

  const folderOf = (i) => MESSAGES[i].folder || 'inbox';
  const visible = () => MESSAGES
    .map((m, i) => ({ m, i }))
    .filter(({ m, i }) => {
      if (folder === 'unread' ? read.has(i) : folder === 'flagged' ? !m.flagged : folderOf(i) !== folder) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return `${m.from} ${m.subject} ${m.preview}`.toLowerCase().includes(q);
    });

  win.body.innerHTML = `
    <div class="mail">
      <div class="mail-list">
        <div class="mail-toolbar" style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-bottom:1px solid var(--line)">
          <button class="btn primary" style="height:26px;padding:0 12px;font-size:11.5px" id="mail-new">${icon('edit')} New mail</button>
          <div style="display:flex;align-items:center;gap:5px;border:1px solid var(--line);border-radius:2px;height:26px;padding:0 8px;margin-left:auto">
            ${icon('search')}<input id="mail-q" placeholder="Search" style="width:90px;border:0;outline:none;background:transparent;font-size:11.5px;color:inherit">
          </div>
        </div>
        <div style="display:flex;gap:2px;padding:6px 8px;border-bottom:1px solid var(--line);overflow-x:auto">
          ${FOLDERS.map(([id, label]) => `<button class="btn" data-folder="${id}" style="height:24px;padding:0 9px;font-size:11px;white-space:nowrap;${folder === id ? 'background:var(--accent);color:#fff;border-color:transparent' : ''}">${label}${id === 'unread' ? ` (${MESSAGES.filter((m, i) => !read.has(i) && folderOf(i) === 'inbox').length})` : ''}</button>`).join('')}
        </div>
        <div id="mail-items" style="flex:1;overflow:auto"></div>
      </div>
      <div class="mail-read" id="mail-read"></div>
    </div>`;

  const items = win.body.querySelector('#mail-items');
  const reader = win.body.querySelector('#mail-read');

  function renderList() {
    const list = visible();
    items.innerHTML = list.length ? list.map(({ m, i }) => `
      <div class="mail-item${i === selected ? ' active' : ''}" data-i="${i}">
        <div class="av" style="background:${m.color}">${m.from[0]}</div>
        <div style="min-width:0;flex:1">
          <div style="display:flex;gap:6px;align-items:baseline"><b style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.from)}</b><span style="font-size:10.5px;color:var(--muted)">${esc(m.date)}</span></div>
          <div style="font-size:12px;${read.has(i) ? 'font-weight:400' : 'font-weight:600'}">${m.flagged ? '★ ' : ''}${esc(m.subject)}</div>
          <div class="s">${esc(m.preview)}</div>
        </div>
        ${read.has(i) ? '' : '<span style="width:6px;height:6px;border-radius:50%;background:var(--accent);margin-top:8px;flex:0 0 6px"></span>'}
      </div>`).join('')
      : `<div class="exp-empty" style="color:var(--muted);font-size:12px;padding:30px;text-align:center">${query ? `Nothing matches "${esc(query)}".` : 'This folder is empty.'}</div>`;

    items.querySelectorAll('[data-i]').forEach((row) => row.addEventListener('click', () => {
      selected = +row.dataset.i;
      read.add(selected);
      renderList();
      renderReader();
    }));
  }

  function renderReader() {
    const m = MESSAGES[selected];
    if (!m) { reader.innerHTML = '<div style="padding:30px;color:var(--muted);font-size:12px">Select a message.</div>'; return; }
    reader.innerHTML = `
      <h2>${esc(m.subject)}</h2>
      <div class="m-meta"><b>${esc(m.from)}</b> &lt;${m.email}&gt; · to Alex · ${esc(m.date)}</div>
      <div>${m.body}</div>
      <div style="margin-top:26px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" id="mail-reply">Reply</button>
        <button class="btn" id="mail-forward">Forward</button>
        <button class="btn" id="mail-flag">${m.flagged ? '★ Unflag' : '☆ Flag'}</button>
        <button class="btn" id="mail-archive">${folderOf(selected) === 'archive' ? 'Move to inbox' : 'Archive'}</button>
        <button class="btn" id="mail-delete">Delete</button>
      </div>`;
    win.setTitle(`${m.subject} - Mail`);

    reader.querySelector('#mail-reply').addEventListener('click', () => compose(`Re: ${m.subject}`, m.email));
    reader.querySelector('#mail-forward').addEventListener('click', () => compose(`Fwd: ${m.subject}`, ''));
    reader.querySelector('#mail-flag').addEventListener('click', () => { m.flagged = !m.flagged; renderList(); renderReader(); });
    reader.querySelector('#mail-archive').addEventListener('click', () => {
      m.folder = folderOf(selected) === 'archive' ? 'inbox' : 'archive';
      notify({ title: 'Mail', body: m.folder === 'archive' ? 'Message archived.' : 'Message moved back to the inbox.', icon: 'mail', timeout: 2200 });
      renderList();
    });
    reader.querySelector('#mail-delete').addEventListener('click', () => {
      MESSAGES.splice(selected, 1);
      selected = Math.max(0, Math.min(selected, MESSAGES.length - 1));
      renderList();
      renderReader();
      notify({ title: 'Mail', body: 'Message deleted.', icon: 'mail', timeout: 2200 });
    });
  }

  function compose(subject = '', to = 'orb@spooky.local') {
    showDialog({
      title: 'New message',
      body: `<div style="display:flex;flex-direction:column;gap:8px">
        <input type="text" placeholder="To" value="${esc(to)}" style="height:28px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:0 8px">
        <input type="text" placeholder="Subject" value="${esc(subject)}" style="height:28px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:0 8px">
        <textarea placeholder="Write a message…" style="height:120px;border:1px solid var(--line);background:var(--win-bg);color:var(--win-fg);padding:8px;resize:none;font:inherit"></textarea>
      </div>`,
      buttons: [{ id: 'cancel', label: 'Cancel' }, { id: 'send', label: 'Send', primary: true }],
      width: 520,
    }).then((r) => {
      if (r !== 'send') return;
      MESSAGES.unshift({
        from: 'You', email: 'alex@windows.local', color: '#495057',
        subject: subject || '(no subject)', preview: 'Sent just now from Mail.', date: 'now', folder: 'sent',
        body: 'This message was sent from Mail for Windows 10 (browser build). It went straight into your Sent folder, which is more than some mail clients manage.',
      });
      selected = 0;
      folder = 'sent';
      renderList(); renderReader();
      notify({ title: 'Mail', body: 'Message sent. It is in your Sent folder.', icon: 'mail' });
    });
  }

  win.body.querySelector('#mail-new').addEventListener('click', () => compose());
  win.body.querySelector('#mail-q').addEventListener('input', (e) => { query = e.target.value; renderList(); });
  win.body.querySelectorAll('[data-folder]').forEach((b) => b.addEventListener('click', () => {
    folder = b.dataset.folder;
    win.body.querySelectorAll('[data-folder]').forEach((x) => {
      const on = x.dataset.folder === folder;
      x.style.background = on ? 'var(--accent)' : '';
      x.style.color = on ? '#fff' : '';
      x.style.borderColor = on ? 'transparent' : '';
    });
    renderList();
  }));

  renderList();
  renderReader();
  return win;
}
