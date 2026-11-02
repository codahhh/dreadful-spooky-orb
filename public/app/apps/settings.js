/* ============================================================
   Settings
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc, showDialog, fmtBytes, bus } from '../utils.js';
import { state, updateSettings, WALLPAPERS, resetAll, save, applySettings } from '../store.js';
import { allApps } from './registry.js';
import { notify } from '../notify.js';
import { openApp } from '../launcher.js';

export const meta = { id: 'settings', name: 'Settings', icon: 'settings' };

const ACCENTS = ['#0078d7', '#0099bc', '#00b7c3', '#107c10', '#498205', '#8764b8', '#744da9', '#b4009e', '#e3008c', '#ff4343', '#ea005e', '#e81123', '#ff8c00', '#ffb900', '#767676', '#4c4a48', '#1f1f1f'];

const NAV = [
  { group: 'System', items: [
    { id: 'home', name: 'Home', icon: 'windows' },
    { id: 'display', name: 'Display', icon: 'display' },
    { id: 'apps', name: 'Apps', icon: 'apps' },
    { id: 'power', name: 'Power & sleep', icon: 'battery' },
  ] },
  { group: 'Devices', items: [
    { id: 'devices', name: 'Bluetooth & other devices', icon: 'bluetooth' },
    { id: 'network', name: 'Network & Internet', icon: 'wifi' },
  ] },
  { group: 'Personalization', items: [
    { id: 'personalization', name: 'Personalization', icon: 'personalization' },
    { id: 'taskbar', name: 'Taskbar', icon: 'view' },
  ] },
  { group: 'Accounts', items: [
    { id: 'accounts', name: 'Your info', icon: 'accounts' },
    { id: 'time', name: 'Time & Language', icon: 'time' },
    { id: 'privacy', name: 'Privacy', icon: 'privacy' },
  ] },
  { group: 'Update & Security', items: [
    { id: 'update', name: 'Windows Update', icon: 'update' },
    { id: 'about', name: 'About', icon: 'info' },
  ] },
];

let currentWin = null;

export function launch(args = {}) {
  if (currentWin && !currentWin.closed) {
    if (args.page) { currentWin._settingsNav?.(args.page); }
    currentWin.restore(); currentWin.focus();
    return currentWin;
  }
  const win = createWindow({
    title: 'Settings', icon: 'settings', width: 1000, height: 680,
    minWidth: 680, minHeight: 420, appId: 'settings',
    onClose: () => { currentWin = null; },
  });
  currentWin = win;

  let page = args.page || 'home';

  win.body.innerHTML = `
    <div class="settings">
      <div class="set-side">
        <div class="set-user">
          <div class="av">${esc((state.settings.userName || 'A')[0].toUpperCase())}</div>
          <div><b>${esc(state.settings.userName || 'Alex')}</b><span>Local account</span></div>
        </div>
        <div class="set-nav"></div>
      </div>
      <div class="set-main" id="set-main"></div>
    </div>`;

  const navEl = win.body.querySelector('.set-nav');
  const main = win.body.querySelector('#set-main');

  function renderNav() {
    navEl.innerHTML = NAV.map((grp) => `
      <div style="padding:10px 16px 4px;font-size:11px;color:var(--muted);font-weight:600">${grp.group}</div>
      ${grp.items.map((it) => `<button class="set-item${it.id === page ? ' active' : ''}" data-page="${it.id}">
        <span style="width:18px;height:18px;display:inline-flex">${icon(it.icon)}</span>${it.name}</button>`).join('')}
    `).join('');
    navEl.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => { page = b.dataset.page; render(); }));
  }

  win._settingsNav = (p) => { page = p; render(); };

  /* ---------- small builders ---------- */
  function toggle(on, onChange) {
    const s = el('button', { class: 'switch' + (on ? ' on' : ''), role: 'switch' });
    s.addEventListener('click', () => {
      const next = !s.classList.contains('on');
      s.classList.toggle('on', next);
      onChange(next);
    });
    return s;
  }
  function row(title, desc, control, ico) {
    const r = el('div', { class: 'set-row' });
    if (ico) r.append(el('span', { class: 'r-ico', html: icon(ico) }));
    const main_ = el('div', { class: 'r-main' }, el('div', { class: 'r-title', text: title }));
    if (desc) main_.append(el('div', { class: 'r-desc', text: desc }));
    r.append(main_);
    if (control) r.append(control);
    return r;
  }
  function card(...children) { return el('div', { class: 'set-card' }, ...children); }
  function h1(t) { return el('h1', { class: 'set-h1', text: t }); }
  function sub(t) { return el('div', { class: 'set-sub', text: t }); }
  function h2(t) { return el('div', { class: 'set-h2', text: t }); }

  function pageHome() {
    const wrap = el('div', {});
    wrap.append(h1('Settings'), el('div', { class: 'set-sub', text: `${state.settings.userName || 'Alex'} · SPOOKY-ORB · Windows 10 Pro` }));
    const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '10px', marginTop: '6px' } });
    [
      { id: 'update', icon: 'update', title: 'Windows Update', sub: 'You are up to date' },
      { id: 'personalization', icon: 'personalization', title: 'Personalization', sub: 'Background, colours, themes' },
      { id: 'display', icon: 'display', title: 'Display', sub: 'Brightness, night light, scale' },
      { id: 'network', icon: 'wifi', title: 'Network & Internet', sub: state.settings.wifi ? 'Wi-Fi connected' : 'Wi-Fi off' },
      { id: 'apps', icon: 'apps', title: 'Apps', sub: 'Installed apps and features' },
      { id: 'accounts', icon: 'accounts', title: 'Accounts', sub: 'Sign-in options, your info' },
      { id: 'time', icon: 'time', title: 'Time & Language', sub: new Date().toLocaleTimeString() },
      { id: 'about', icon: 'info', title: 'About', sub: 'Device specifications' },
    ].forEach((it) => {
      const b = el('button', { style: { display: 'flex', gap: '12px', alignItems: 'center', padding: '14px', border: '1px solid var(--line)', borderRadius: '4px', background: 'var(--win-bg)', textAlign: 'left' } });
      b.innerHTML = `<span style="width:28px;height:28px;display:inline-flex">${icon(it.icon, 28)}</span>
        <span style="display:flex;flex-direction:column;gap:2px"><b style="font-size:12.5px;font-weight:600">${it.title}</b><span style="font-size:11.5px;color:var(--muted)">${it.sub}</span></span>`;
      b.addEventListener('click', () => { page = it.id; render(); });
      b.addEventListener('pointerenter', () => b.style.background = 'var(--hover)');
      b.addEventListener('pointerleave', () => b.style.background = 'var(--win-bg)');
      grid.append(b);
    });
    wrap.append(grid);
    return wrap;
  }

  function pageDisplay() {
    const wrap = el('div', {});
    wrap.append(h1('Display'), sub('Change brightness, night light and scaling.'));
    const brightness = el('input', { type: 'range', min: '20', max: '100', value: state.settings.brightness, style: { width: '190px', accentColor: 'var(--accent)' } });
    const brVal = el('span', { text: state.settings.brightness + '%', style: { width: '38px', textAlign: 'right', fontSize: '11.5px', color: 'var(--muted)' } });
    brightness.addEventListener('input', () => {
      updateSettings({ brightness: +brightness.value });
      brVal.textContent = brightness.value + '%';
    });
    wrap.append(card(
      row('Brightness', 'Dim the wallpaper behind your windows.', el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, el('span', { html: icon('sun') }), brightness, brVal), 'brightness'),
      row('Night light', 'Warmer colours at night to help you sleep.', toggle(state.settings.nightLight, (v) => { updateSettings({ nightLight: v }); refreshPreview(); }), 'nightlight'),
      row('Night light strength', 'How warm the screen looks.', el('input', { type: 'range', min: '0', max: '80', value: state.settings.nightLightStrength, style: { accentColor: 'var(--accent)' }, oninput: (e) => { updateSettings({ nightLightStrength: +e.target.value }); } }), 'brightness'),
    ));
    wrap.append(h2('Scale and layout'));
    const scales = ['100% (Recommended)', '125%', '150%', '175%'];
    wrap.append(card(
      row('Change the size of text, apps and other items', 'Scaling is fixed at 100% in this build.', el('select', { style: 'height:28px;background:var(--win-bg);color:var(--win-fg);border:1px solid var(--line);padding:0 6px' }, ...scales.map((s) => el('option', { text: s }))), 'display'),
      row('Display resolution', '1920 × 1080 (Recommended)', el('select', { style: 'height:28px;background:var(--win-bg);color:var(--win-fg);border:1px solid var(--line);padding:0 6px' },
        el('option', { text: '1920 × 1080 (Recommended)' }), el('option', { text: '1600 × 900' }), el('option', { text: '1280 × 720' })), 'display'),
      row('Display orientation', 'Landscape', el('select', { style: 'height:28px;background:var(--win-bg);color:var(--win-fg);border:1px solid var(--line);padding:0 6px' }, el('option', { text: 'Landscape' }), el('option', { text: 'Portrait' })), 'project'),
    ));
    wrap.append(h2('Multiple displays'));
    wrap.append(card(row('Detect another display', 'No additional displays detected.', el('button', { class: 'btn', text: 'Detect', onclick: () => notify({ title: 'Display', body: 'No other displays were found.', icon: 'display' }) }), 'display')));
    return wrap;
  }

  function pagePersonalization() {
    const wrap = el('div', {});
    wrap.append(h1('Personalization'), sub('Background, colours and lock screen.'));
    wrap.append(h2('Background'));
    const wall = el('div', { class: 'set-card' });
    const grid = el('div', { class: 'wall-grid' });
    const allWalls = [...WALLPAPERS.map((w) => ({ id: w.id, name: w.name, cls: 'wp-' + w.id })), state.wallpaperCustom ? { id: 'custom', name: 'Custom picture', cls: '', bg: state.wallpaperCustom } : null].filter(Boolean);
    allWalls.forEach((w) => {
      const t = el('button', { class: 'wall-thumb' + (state.settings.wallpaper === w.id ? ' active' : ''), title: w.name });
      const inner = el('div', { class: w.cls });
      if (w.bg) inner.style.backgroundImage = `url("${w.bg}")`;
      t.append(inner, el('span', { text: w.name }));
      t.addEventListener('click', () => {
        state.wallpaperCustom = w.id === 'custom' ? w.bg : null;
        updateSettings({ wallpaper: w.id === 'custom' ? 'hero' : w.id });
        save();
        applySettings();
        render();
      });
      grid.append(t);
    });
    wall.append(grid);
    const browse = el('div', { style: { padding: '0 14px 14px', display: 'flex', gap: '10px', alignItems: 'center' } });
    const fileInput = el('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    fileInput.addEventListener('change', () => {
      const f = fileInput.files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = () => {
        state.wallpaperCustom = fr.result;
        updateSettings({ wallpaper: 'custom' });
        save(); applySettings(); render();
        notify({ title: 'Personalization', body: 'Your picture is now the desktop background.', icon: 'personalization' });
      };
      fr.readAsDataURL(f);
    });
    const b = el('button', { class: 'btn', text: 'Browse…' });
    b.addEventListener('click', () => fileInput.click());
    const clr = el('button', { class: 'btn', text: 'Clear custom picture' });
    clr.addEventListener('click', () => { state.wallpaperCustom = null; updateSettings({ wallpaper: 'hero' }); save(); applySettings(); render(); });
    browse.append(b, fileInput, clr);
    wall.append(browse);
    wrap.append(wall);

    wrap.append(h2('Colours'));
    const colorCard = el('div', { class: 'set-card' });
    colorCard.append(row('Choose your accent colour', 'Used across the shell and apps.', null, 'personalization'));
    const sw = el('div', { class: 'swatches' });
    ACCENTS.forEach((c) => {
      const b2 = el('button', { class: 'sw' + (state.settings.accent.toLowerCase() === c ? ' active' : ''), style: { background: c }, title: c });
      b2.addEventListener('click', () => { updateSettings({ accent: c }); render(); });
      sw.append(b2);
    });
    const custom = el('input', { type: 'color', value: state.settings.accent, style: { width: '30px', height: '28px', border: '1px solid var(--line)', background: 'transparent' }, oninput: (e) => updateSettings({ accent: e.target.value }) });
    sw.append(custom);
    colorCard.append(sw);
    colorCard.append(
      row('Light theme', 'Bright windows and menus.', toggle(state.settings.theme === 'light', (v) => { updateSettings({ theme: v ? 'light' : 'dark' }); }), 'sun'),
      row('Show accent colour on the taskbar', 'Tints the taskbar with your accent colour.', toggle(state.settings.taskbarAccent, (v) => updateSettings({ taskbarAccent: v })), 'view'),
    );
    wrap.append(colorCard);

    wrap.append(h2('Desktop icons'));
    wrap.append(card(
      row('Show desktop icons', 'Toggle all desktop shortcuts.', toggle(state.settings.showDesktopIcons, (v) => {
        state.settings.showDesktopIcons = v; save();
        document.getElementById('desktop-icons').style.display = v ? 'block' : 'none';
      }), 'desktop'),
      row('Icon size', 'Applies immediately.', (() => {
        const sel = el('select', { style: 'height:28px;background:var(--win-bg);color:var(--win-fg);border:1px solid var(--line);padding:0 6px' },
          ...['large', 'medium', 'small'].map((s) => el('option', { value: s, text: s[0].toUpperCase() + s.slice(1) + ' icons', selected: state.settings.iconSize === s })));
        sel.addEventListener('change', () => { updateSettings({ iconSize: sel.value }); bus.emit('desktop:refresh'); });
        return sel;
      })(), 'grid'),
    ));
    return wrap;
  }

  function pageTaskbar() {
    const wrap = el('div', {});
    wrap.append(h1('Taskbar'), sub('Pinned apps and system tray.'));
    const card1 = el('div', { class: 'set-card' });
    const pinned = state.settings.taskbarPinned;
    pinned.forEach((id) => {
      const meta_ = allApps().find((a) => a.id === id);
      const ctrl = el('button', { class: 'btn', text: 'Unpin' });
      ctrl.addEventListener('click', () => {
        updateSettings({ taskbarPinned: state.settings.taskbarPinned.filter((x) => x !== id) });
        render();
      });
      card1.append(row(meta_?.name || id, 'Pinned to taskbar', ctrl, meta_?.icon || 'apps'));
    });
    const add = el('button', { class: 'btn primary', text: 'Pin an app' });
    add.addEventListener('click', () => {
      const available = allApps().filter((a) => !state.settings.taskbarPinned.includes(a.id));
      showDialog({
        title: 'Pin to taskbar',
        body: `<div style="max-height:260px;overflow:auto">${available.map((a, i) => `<button class="sp-row" data-pin="${a.id}"><span class="s-ico">${icon(a.icon)}</span>${esc(a.name)}</button>`).join('')}</div>`,
        buttons: [{ id: 'close', label: 'Done', primary: true }],
      }).then((r) => { render(); });
      requestAnimationFrame(() => {
        document.querySelectorAll('[data-pin]').forEach((b) => b.addEventListener('click', () => {
          if (!state.settings.taskbarPinned.includes(b.dataset.pin)) state.settings.taskbarPinned.push(b.dataset.pin);
          save();
          bus.emit('taskbar:refresh');
          b.style.opacity = '.4';
        }));
      });
    });
    card1.append(el('div', { class: 'set-row' }, el('div', { class: 'r-main' }, el('div', { class: 'r-title', text: 'Add a pinned app' })), add));
    wrap.append(card1);
    wrap.append(card(
      row('Show desktop icons', 'Icons in the bottom-left corner.', toggle(state.settings.showDesktopIcons, (v) => {
        state.settings.showDesktopIcons = v; save();
        document.getElementById('desktop-icons').style.display = v ? 'block' : 'none';
      }), 'desktop'),
      row('Show badges for notifications', 'Notification indicator on the action center button.', toggle(true, () => notify({ title: 'Taskbar', body: 'Badge settings are baked into this build.', icon: 'view' })), 'shield'),
      row('Taskbar position', 'Bottom (locked)', el('span', { style: { fontSize: '11.5px', color: 'var(--muted)' }, text: 'Locked' }), 'view'),
    ));
    return wrap;
  }

  function pageApps() {
    const wrap = el('div', {});
    wrap.append(h1('Apps'), sub(`${allApps().length} installed apps · 132 GB free of 512 GB`));
    const c = el('div', { class: 'set-card' });
    allApps().sort((a, b) => a.name.localeCompare(b.name)).forEach((a) => {
      const size = (5 + (a.name.length * 7) % 280) + '.3 MB';
      const btn = el('button', { class: 'btn', text: 'Uninstall' });
      btn.addEventListener('click', () => {
        showDialog({ title: 'Uninstall', body: `Are you sure you want to remove ${esc(a.name)}?<br><span style="color:#888;font-size:11.5px">This build ships apps as source code, so nothing will actually be removed.</span>`, buttons: [{ id: 'no', label: 'Cancel' }, { id: 'yes', label: 'Uninstall', primary: true }] })
          .then((r) => { if (r === 'yes') notify({ title: 'Apps', body: `${a.name} cannot be removed from this build.`, icon: 'apps' }); });
      });
      c.append(row(a.name, size, btn, a.icon));
    });
    wrap.append(c);
    return wrap;
  }

  function pageAccounts() {
    const wrap = el('div', {});
    wrap.append(h1('Your info'), sub('Account settings for this local account.'));
    const av = el('div', { style: { display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', border: '1px solid var(--line)', borderRadius: '4px', marginBottom: '14px' } });
    av.innerHTML = `<div class="avatar" style="width:72px;height:72px;font-size:30px;margin:0">${esc((state.settings.userName || 'A')[0].toUpperCase())}</div>
      <div><b style="font-size:15px;font-weight:500">${esc(state.settings.userName || 'Alex')}</b><div style="font-size:12px;color:var(--muted);margin-top:2px">Local account · Administrator</div></div>`;
    wrap.append(av);
    const nameInput = el('input', { type: 'text', value: state.settings.userName, style: { width: '180px', height: '28px', border: '1px solid var(--line)', background: 'var(--win-bg)', color: 'var(--win-fg)', padding: '0 8px' } });
    const apply = el('button', { class: 'btn primary', text: 'Rename' });
    apply.addEventListener('click', () => {
      const v = nameInput.value.trim();
      if (!v) return;
      updateSettings({ userName: v });
      document.getElementById('signin-name').textContent = v;
      document.getElementById('signin-avatar').textContent = v[0].toUpperCase();
      notify({ title: 'Accounts', body: `This PC now greets you as ${v}.`, icon: 'accounts' });
      render();
    });
    wrap.append(card(
      row('Your name', 'Shown on the sign-in screen.', el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, nameInput, apply), 'user'),
      row('Sign-in options', 'Password, PIN and picture password are simulated.', el('button', { class: 'btn', text: 'Manage', onclick: () => notify({ title: 'Sign-in options', body: 'Any password is accepted on this build.', icon: 'lock' }) }), 'lock'),
      row('Family & other users', 'Add someone else to this PC.', el('button', { class: 'btn', text: 'Add', onclick: () => notify({ title: 'Accounts', body: 'Only one local account exists on this PC.', icon: 'accounts' }) }), 'accounts'),
    ));
    return wrap;
  }

  function pageTime() {
    const wrap = el('div', {});
    wrap.append(h1('Time & Language'), sub('Date, time, region and keyboard.'));
    wrap.append(card(
      row('Current date and time', new Date().toLocaleString(), el('button', { class: 'btn', text: 'Sync now', onclick: () => notify({ title: 'Time', body: 'Clock synced with time.windows.com', icon: 'time' }) }), 'time'),
      row('Time zone', Intl.DateTimeFormat().resolvedOptions().timeZone, null, 'globe'),
      row('Set time automatically', 'Controlled by the browser.', toggle(true, () => {}), 'refresh'),
      row('Language', 'English (United States)', el('button', { class: 'btn', text: 'Add a language', onclick: () => notify({ title: 'Language', body: 'Language packs are not available in this build.', icon: 'globe' }) }), 'globe'),
      row('Keyboard', 'ENG — US QWERTY', el('button', { class: 'btn', text: 'Options', onclick: () => notify({ title: 'Keyboard', body: 'Only the US layout is installed.', icon: 'keyboard' }) }), 'keyboard'),
    ));
    return wrap;
  }

  function pagePrivacy() {
    const wrap = el('div', {});
    wrap.append(h1('Privacy'), sub('Everything runs locally in your browser.'));
    wrap.append(card(
      row('Location', 'Apps can request your location.', toggle(false, (v) => notify({ title: 'Privacy', body: `Location access ${v ? 'enabled' : 'disabled'}.`, icon: 'privacy' })), 'globe'),
      row('Camera', 'No camera hardware is exposed.', toggle(false, () => {}), 'eye'),
      row('Microphone', 'No microphone hardware is exposed.', toggle(false, () => {}), 'volume'),
      row('Diagnostic data', 'Send optional diagnostic data to Microsoft.', toggle(false, () => {}), 'info'),
      row('Tailored experiences', 'Personalised tips based on your data.', toggle(true, () => {}), 'star'),
    ));
    return wrap;
  }

  function pageUpdate() {
    const wrap = el('div', {});
    wrap.append(h1('Windows Update'), sub('Keep your PC secure and up to date.'));
    const statusCard = el('div', { class: 'set-card', style: { padding: '16px' } });
    statusCard.innerHTML = `<div style="display:flex;gap:12px;align-items:center">
      <span style="width:30px;height:30px;display:inline-flex">${icon('shield', 30)}</span>
      <div><b style="font-size:13px">You're up to date</b>
      <div style="font-size:11.5px;color:var(--muted);margin-top:3px">Last checked: today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>
    </div>
    <div style="margin-top:14px;display:flex;align-items:center;gap:12px">
      <button class="btn primary" id="upd-check">Check for updates</button>
      <div class="progress" id="upd-prog" style="display:none"><div></div></div>
      <span id="upd-status" style="font-size:11.5px;color:var(--muted)"></span>
    </div>`;
    wrap.append(statusCard);
    wrap.append(h2('Update history'));
    const hist = el('div', { class: 'set-card' });
    [
      ['2024-10-28', 'Cumulative Update for Windows 10 Version 22H2 (KB5044273)', 'Successfully installed'],
      ['2024-10-11', 'Security Intelligence Update (KB2267602)', 'Successfully installed'],
      ['2024-09-22', 'Servicing Stack Update (KB5043936)', 'Successfully installed'],
    ].forEach(([d, n, s]) => hist.append(row(n, `${d} · ${s}`, null, 'update')));
    wrap.append(hist);
    wrap.append(h2('Reset this PC'));
    wrap.append(card(row('Reset this PC', 'Wipes local settings and restores the original files.', el('button', {
      class: 'btn', text: 'Get started',
      onclick: async () => {
        const r = await showDialog({
          title: 'Reset this PC',
          body: 'This will remove all files and settings created in this browser, and restore the factory desktop.<br><br><b>Continue?</b>',
          buttons: [{ id: 'cancel', label: 'Cancel' }, { id: 'reset', label: 'Reset', primary: true }],
        });
        if (r === 'reset') { resetAll(); location.reload(); }
      },
    }), 'restart')));
    setTimeout(() => {
      const btn = wrap.querySelector('#upd-check');
      btn?.addEventListener('click', () => {
        const prog = wrap.querySelector('#upd-prog');
        const status = wrap.querySelector('#upd-status');
        prog.style.display = 'block';
        status.textContent = 'Checking for updates…';
        const bar = prog.firstElementChild;
        let p = 0;
        const t = setInterval(() => {
          p = Math.min(100, p + 12);
          bar.style.width = p + '%';
          if (p >= 100) {
            clearInterval(t);
            status.textContent = 'You are up to date.';
            setTimeout(() => { prog.style.display = 'none'; bar.style.width = '0'; }, 1200);
            notify({ title: 'Windows Update', body: 'You are up to date.', icon: 'shield' });
          }
        }, 160);
      });
    });
    return wrap;
  }

  function pageAbout() {
    const wrap = el('div', {});
    wrap.append(h1('About'));
    const c = el('div', { class: 'set-about' });
    c.innerHTML = `<div class="logo">${icon('windows')}</div>
      <div><b style="font-size:15px;font-weight:500">SPOOKY-ORB</b>
      <div style="font-size:12px;color:var(--muted);margin-top:3px">Dreadful Spooky Orb · Windows 10 Pro</div></div>`;
    wrap.append(c);
    const specs = el('dl', { class: 'set-kv' });
    const rows = [
      ['Device name', 'SPOOKY-ORB'],
      ['Full device name', 'spooky-orb.local'],
      ['Processor', 'Dreadful Spooky Orb CPU @ 3.60 GHz'],
      ['Installed RAM', '16.0 GB (15.9 GB usable)'],
      ['Device ID', 'A1B2C3D4-5E6F-7A8B-9C0D-1E2F3A4B5C6D'],
      ['Product ID', '00330-80000-00000-AA123'],
      ['System type', '64-bit operating system, x64-based processor'],
      ['Edition', 'Windows 10 Pro'],
      ['Version', '22H2'],
      ['OS build', '19045.3803'],
      ['Experience', 'Windows Feature Experience Pack 1000.19060.1000.0'],
      ['Renderer', navigator.userAgent],
    ];
    rows.forEach(([k, v]) => { specs.append(el('dt', { text: k }), el('dd', { text: v })); });
    wrap.append(specs);
    wrap.append(h2('Related'));
    wrap.append(card(
      row('System info', 'Deep dive into hardware and components.', el('button', { class: 'btn', text: 'Open', onclick: () => openApp('taskmanager', { tab: 'performance' }) }), 'cpu'),
      row('Copy specs', 'Copy a summary to your clipboard.', el('button', {
        class: 'btn', text: 'Copy',
        onclick: () => { navigator.clipboard?.writeText('SPOOKY-ORB · Dreadful Spooky Orb CPU @ 3.60 GHz · 16.0 GB · Windows 10 Pro 22H2 (19045.3803)').catch(() => {}); notify({ title: 'Copied', body: 'Device specs copied to clipboard.', icon: 'copy' }); },
      }), 'copy'),
    ));
    return wrap;
  }

  function pageNetwork() {
    const wrap = el('div', {});
    wrap.append(h1('Network & Internet'), sub('Wi-Fi, ethernet and connection status.'));
    wrap.append(card(
      row('Wi-Fi', state.settings.wifi ? 'Connected to SpookyOrb-5G' : 'Disconnected', toggle(state.settings.wifi, (v) => updateSettings({ wifi: v })), 'wifi'),
      row('Airplane mode', 'Stop all wireless communication.', toggle(state.settings.airplane, (v) => updateSettings({ airplane: v })), 'airplane'),
      row('Ethernet', 'Cable not connected', el('span', { style: { fontSize: '11.5px', color: 'var(--muted)' }, text: 'Not connected' }), 'globe'),
      row('Proxy', 'Automatically detect settings', toggle(true, () => {}), 'settings'),
    ));
    wrap.append(h2('Available networks'));
    const list = el('div', { class: 'set-card' });
    [['SpookyOrb-5G', 'Connected, secured'], ['SpookyOrb-2.4G', 'Secured'], ['FREE_AIRPORT_WIFI', 'Open'], ['NETGEAR-42', 'Secured']].forEach(([n, s]) =>
      list.append(row(n, s, el('button', { class: 'btn', text: n === 'SpookyOrb-5G' ? 'Disconnect' : 'Connect', onclick: () => notify({ title: n, body: n === 'SpookyOrb-5G' ? 'Disconnected (demo).' : `Connected to ${n} (demo).`, icon: 'wifi' }) }), 'wifi')));
    wrap.append(list);
    return wrap;
  }

  function pageDevices() {
    const wrap = el('div', {});
    wrap.append(h1('Bluetooth & other devices'), sub('Manage the hardware attached to your PC.'));
    wrap.append(card(
      row('Bluetooth', state.settings.bluetooth ? 'On' : 'Off', toggle(state.settings.bluetooth, (v) => updateSettings({ bluetooth: v })), 'bluetooth'),
      row('Spooky Orb Mouse', 'Connected · Battery 84%', el('button', { class: 'btn', text: 'Remove', onclick: () => notify({ title: 'Devices', body: 'This device cannot be removed.', icon: 'bluetooth' }) }), 'connect'),
      row('Orb Mechanical Keyboard', 'Connected', el('button', { class: 'btn', text: 'Remove', onclick: () => notify({ title: 'Devices', body: 'This device cannot be removed.', icon: 'keyboard' }) }), 'keyboard'),
      row('Add Bluetooth or other device', '+', el('button', { class: 'btn primary', text: 'Add device', onclick: () => notify({ title: 'Add a device', body: 'Searching for devices… none found.', icon: 'bluetooth' }) }), 'plus'),
    ));
    return wrap;
  }

  function pagePower() {
    const wrap = el('div', {});
    wrap.append(h1('Power & sleep'), sub('Screen and sleep settings.'));
    const sel = (opts) => el('select', { style: 'height:28px;background:var(--win-bg);color:var(--win-fg);border:1px solid var(--line);padding:0 6px' }, ...opts.map((o) => el('option', { text: o })));
    wrap.append(card(
      row('Screen', 'Turn off after', sel(['5 minutes', '10 minutes', '30 minutes', 'Never']), 'display'),
      row('Sleep', 'When plugged in, PC sleeps after', sel(['15 minutes', '1 hour', 'Never']), 'sleep'),
      row('Battery saver', '77% battery — on when below 20%', toggle(true, () => {}), 'battery'),
    ));
    return wrap;
  }

  const pages = {
    home: pageHome, display: pageDisplay, personalization: pagePersonalization, taskbar: pageTaskbar,
    apps: pageApps, accounts: pageAccounts, time: pageTime, privacy: pagePrivacy, update: pageUpdate,
    about: pageAbout, network: pageNetwork, devices: pageDevices, power: pagePower,
  };

  function refreshPreview() { /* settings apply immediately */ }

  function render() {
    renderNav();
    main.innerHTML = '';
    const fn = pages[page] || pageHome;
    main.append(fn());
    main.scrollTop = 0;
  }

  render();
  return win;
}
