/* ============================================================
   PowerShell-style terminal
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc, fmtBytes, fmtDate, bus } from '../utils.js';
import {
  state, list, getNode, read, mkdir, saveAs, remove, parentPath, joinPath, normPath, baseName, createFile, isFolder,
} from '../store.js';
import { openApp } from '../launcher.js';
import { allApps } from './registry.js';
import { notify } from '../notify.js';

export const meta = { id: 'terminal', name: 'Windows PowerShell', icon: 'terminal' };

const BANNER = `Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

Try the new cross-platform PowerShell https://aka.ms/pscore6
Type "help" for a list of commands.
`;

export function launch(args = {}) {
  const win = createWindow({
    title: 'Windows PowerShell', icon: 'terminal', width: 900, height: 560,
    minWidth: 460, minHeight: 240, appId: 'terminal',
  });

  let cwd = args.path || 'C:\\Users\\Alex';
  let history = [];
  let histIdx = -1;

  win.body.innerHTML = `
    <div class="term">
      <div class="term-scroll" id="term-scroll"></div>
    </div>`;
  const scroll = win.body.querySelector('#term-scroll');

  function promptText() {
    const user = state.settings.userName || 'Alex';
    return `PS ${cwd}>`;
  }

  function line(html = '') {
    const d = el('div', { class: 'term-line' });
    d.innerHTML = html;
    scroll.append(d);
    scroll.scrollTop = scroll.scrollHeight;
    return d;
  }

  function print(text, cls = '') {
    String(text).split('\n').forEach((t) => line(cls ? `<span class="${cls}">${esc(t)}</span>` : esc(t)));
  }

  function inputLine() {
    const wrap = el('div', { class: 'term-input-line' });
    wrap.innerHTML = `<span class="term-prompt"></span><input class="term-input" spellcheck="false" autocomplete="off">`;
    wrap.querySelector('.term-prompt').textContent = promptText() + ' ';
    scroll.append(wrap);
    const input = wrap.querySelector('input');
    input.focus();
    scroll.scrollTop = scroll.scrollHeight;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = input.value;
        input.disabled = true;
        const frozen = el('div', { class: 'term-line' });
        frozen.innerHTML = `<span class="term-prompt">${esc(promptText())}</span> ${esc(cmd)}`;
        wrap.replaceWith(frozen);
        history.push(cmd);
        histIdx = history.length;
        run(cmd);
        inputLine();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (histIdx > 0) { histIdx--; input.value = history[histIdx] || ''; input.setSelectionRange(input.value.length, input.value.length); }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx] || ''; }
        else { histIdx = history.length; input.value = ''; }
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        scroll.innerHTML = '';
        inputLine();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const parts = input.value.split(' ');
        const frag = parts[parts.length - 1];
        const matches = list(cwd).filter((i) => i.name.toLowerCase().startsWith(frag.toLowerCase()));
        if (matches.length === 1) {
          parts[parts.length - 1] = matches[0].name.includes(' ') ? `"${matches[0].name}"` : matches[0].name;
          input.value = parts.join(' ');
        } else if (matches.length > 1) {
          print(matches.map((m) => m.name).join('   '));
        }
      }
    });
    scroll.addEventListener('click', (e) => {
      if (!e.target.closest('input') && window.getSelection().toString() === '') input.focus();
    });
  }

  const resolve = (p) => {
    if (!p) return cwd;
    let q = p.replace(/^"|"$/g, '');
    if (/^[A-Za-z]:/.test(q)) return normPath(q);
    if (q === '..') return parentPath(cwd) || cwd;
    if (q === '.') return cwd;
    if (q === '~') return 'C:\\Users\\Alex';
    if (q.startsWith('.\\')) q = q.slice(2);
    return joinPath(cwd, q);
  };

  function fileRows(path) {
    const items = list(path);
    if (!items.length) { print(''); return; }
    const dirs = items.filter((i) => i.type !== 'file');
    const files = items.filter((i) => i.type === 'file');
    print('');
    print('    Directory: ' + path);
    print('');
    print('Mode                 LastWriteTime         Length Name');
    print('----                 -------------         ------ ----');
    dirs.forEach((d) => line(`<span class="term-line"><span style="display:inline-block;width:21ch">d-----</span><span style="display:inline-block;width:20ch">${fmtDate(d.modified, true)}</span><span style="display:inline-block;width:7ch"></span><span class="dir">${esc(d.name)}</span></span>`));
    files.forEach((f) => line(`<span class="term-line"><span style="display:inline-block;width:21ch">-a----</span><span style="display:inline-block;width:20ch">${fmtDate(f.modified, true)}</span><span style="display:inline-block;width:7ch;text-align:right">${String(f.content ? f.content.length : 0).padStart(6)}</span> <span class="file">${esc(f.name)}</span></span>`));
    print('');
  }

  function systeminfo() {
    const up = Math.floor(performance.now() / 1000);
    print(`
Host Name:                 SPOOKY-ORB
OS Name:                   Microsoft Windows 10 Pro
OS Version:                10.0.19045 N/A Build 19045
OS Manufacturer:           Microsoft Corporation
Registered Owner:          ${state.settings.userName}
Registered Organization:   Dreadful Spooky Orb
Product ID:                00330-80000-00000-AA123
Original Install Date:     ${new Date().toLocaleDateString()}
System Boot Time:          ${new Date(Date.now() - up * 1000).toLocaleString()}
System Manufacturer:       Dreadful Systems
System Model:              Spooky Orb 620
System Type:               x64-based PC
Processor(s):              1 Processor(s) Installed.
                           [01]: Dreadful Spooky Orb CPU @ 3.60GHz
BIOS Version:              ORB-1.04, ${new Date().toLocaleDateString()}
Total Physical Memory:     16,384 MB
Available Physical Memory: 9,842 MB
Locale:                    en-US
Time Zone:                 (UTC+00:00) Dublin, Edinburgh, Lisbon, London
` .replace(/^\n/, ''));
  }

  function neofetch() {
    const logo = [
      '                    ',
      '   ██████ ██████   ',
      '   ██████ ██████   ',
      '   ██████ ██████   ',
      '                    ',
      '   ██████ ██████   ',
      '   ██████ ██████   ',
      '   ██████ ██████   ',
      '                    ',
    ];
    const name = state.settings.userName || 'Alex';
    const up = Math.floor(performance.now() / 60000);
    const info = [
      `${name}@SPOOKY-ORB`,
      '--------------',
      'OS: Windows 10 Pro 22H2',
      'Kernel: NT 10.0.19045',
      'Shell: PowerShell 5.1',
      'DE: Windows Shell (browser build)',
      'WM: dreadful-wm',
      'CPU: Dreadful Spooky Orb @ 3.60GHz',
      'GPU: Orb Graphics 620',
      'Memory: 9842MiB / 16384MiB',
      `Uptime: ${up} min`,
      `Resolution: ${window.innerWidth}x${window.innerHeight}`,
      'Terminal: Windows Terminal',
      'Theme: Windows 10 Light',
    ];
    const rows = Math.max(logo.length, info.length);
    for (let i = 0; i < rows; i++) {
      const l = logo[i] || ' '.repeat(20);
      const r = info[i] || '';
      line(`<span class="term-line"><span style="color:#3b78ff;white-space:pre">${l}</span>  ${esc(r)}</span>`);
    }
  }

  const commands = {
    help() {
      print(`
Available commands
------------------
  help                 Show this help
  dir / ls             List the current directory
  cd <path>            Change directory
  type / cat <file>    Print a file
  mkdir <name>         Create a directory
  new-item <name>      Create a text file
  del / rm <name>      Delete a file or folder
  echo <text>          Print text
  cls / clear          Clear the screen
  whoami               Current user
  hostname             Computer name
  date / time          Date and time
  systeminfo           System information
  ipconfig             Network configuration
  ping <host>          Ping a host
  tasklist             Running windows
  taskkill <app>       Close a window by app id
  tree                 Directory tree
  open <app>           Launch an app (try: open notepad)
  apps                 List installed apps
  neofetch             System summary, ASCII art
  ver                  Windows version
  title <text>         Set the window title
  color green|blue     Change terminal colour
  exit                 Close the terminal
`);
    },
    dir() { fileRows(cwd); },
    ls() { fileRows(cwd); },
    gci() { fileRows(cwd); },
    cd(arg) {
      const p = resolve(arg);
      if (p === '') { cwd = ''; return; }
      const n = getNode(p);
      if (!n) { print(`cd : Cannot find path '${p}' because it does not exist.`, 'err'); return; }
      if (n.type === 'file') { print(`cd : '${p}' is not a directory.`, 'err'); return; }
      cwd = p;
    },
    chdir(arg) { commands.cd(arg); },
    type(arg) {
      const p = resolve(arg);
      const c = read(p);
      if (c == null) { print(`type : Cannot find path '${p}'.`, 'err'); return; }
      if (getNode(p)?.kind === 'image') { print(`type : '${baseName(p)}' is a binary image file.`, 'warn'); return; }
      print(String(c).replace(/\r/g, ''));
    },
    cat(arg) { commands.type(arg); },
    mkdir(arg) {
      if (!arg) { print('mkdir : Missing directory name.', 'err'); return; }
      const p = mkdir(cwd, arg.replace(/^"|"$/g, ''));
      if (p) print(`    Directory: ${p}`, 'ok');
      else print('mkdir : Could not create directory.', 'err');
    },
    'new-item'(arg) {
      if (!arg) { print('new-item : Missing file name.', 'err'); return; }
      const p = createFile(cwd, arg.replace(/^"|"$/g, ''), '');
      if (p) print(`Created ${p}`, 'ok');
    },
    del(arg) {
      const p = resolve(arg);
      if (!getNode(p)) { print(`del : Cannot find '${arg}'.`, 'err'); return; }
      remove(p);
      bus.emit('recycle:changed');
      print(`Deleted ${p} (moved to Recycle Bin)`, 'ok');
    },
    rm(arg) { commands.del(arg); },
    echo(...a) { print(a.join(' ')); },
    'write-output'(...a) { print(a.join(' ')); },
    cls() { scroll.innerHTML = ''; },
    clear() { scroll.innerHTML = ''; },
    cls_() {},
    whoami() { print(`spooky-orb\\${(state.settings.userName || 'alex').toLowerCase()}`); },
    hostname() { print('SPOOKY-ORB'); },
    date() { print(new Date().toUTCString()); },
    time() { print(new Date().toLocaleTimeString()); },
    systeminfo() { systeminfo(); },
    ver() { print('Microsoft Windows [Version 10.0.19045.3803]'); },
    ipconfig() {
      print(`
Windows IP Configuration

Wireless LAN adapter Wi-Fi:

   Connection-specific DNS Suffix  . : orb.local
   Link-local IPv6 Address . . . . . : fe80::a1b2:c3d4:e5f6:7890%12
   IPv4 Address. . . . . . . . . . . : 192.168.1.42
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
`);
    },
    ping(arg) {
      if (!arg) { print('ping : Missing host.', 'err'); return; }
      print(`Pinging ${arg} with 32 bytes of data:`);
      let i = 0;
      const t = setInterval(() => {
        print(`Reply from ${arg}: bytes=32 time=${8 + Math.floor(Math.random() * 20)}ms TTL=118`);
        if (++i >= 4) {
          clearInterval(t);
          print(`\nPing statistics for ${arg}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`);
        }
      }, 420);
    },
    tasklist() {
      print('\nImage Name                     PID Session Name        Mem Usage');
      print('========================= ======== ================ ============');
      const wins = [...document.querySelectorAll('.win')].map((w) => w.dataset.app);
      print(`System Idle Process              0 Services                   8 K`);
      print(`explorer.exe                  1204 Console               84,212 K`);
      [...new Set(wins)].forEach((app, i) => {
        const name = (app + '.exe').padEnd(26);
        print(`${name} ${String(2000 + i * 37).padStart(8)} Console           ${(30000 + i * 9123).toLocaleString()} K`);
      });
    },
    taskkill(arg) {
      const w = [...document.querySelectorAll('.win')].find((x) => x.dataset.app === (arg || '').replace('.exe', ''));
      if (!w) { print(`taskkill : No running task named '${arg}'.`, 'err'); return; }
      w.querySelector('.win-btn.close')?.click();
      print('SUCCESS: Sent termination signal.', 'ok');
    },
    tree() {
      print(cwd);
      const walk = (p, prefix, depth) => {
        if (depth > 2) return;
        const items = list(p).filter((i) => i.type === 'folder');
        items.slice(0, 6).forEach((it, i) => {
          const last = i === Math.min(items.length, 6) - 1;
          print(`${prefix}${last ? '└───' : '├───'}${it.name}`);
          walk(it.path, prefix + (last ? '    ' : '│   '), depth + 1);
        });
      };
      walk(cwd, '', 0);
    },
    open(arg) {
      if (!arg) { print('open : Which app? Try "apps".', 'err'); return; }
      const app = allApps().find((a) => a.id === arg.toLowerCase() || a.name.toLowerCase().includes(arg.toLowerCase()));
      if (!app) { print(`open : No app named '${arg}'. Try "apps".`, 'err'); return; }
      openApp(app.id);
      print(`Starting ${app.name}…`, 'ok');
    },
    start(arg) { commands.open(arg); },
    apps() { print(allApps().map((a) => `  ${a.id.padEnd(14)} ${a.name}`).join('\n')); },
    neofetch() { neofetch(); },
    title(...a) {
      const t = a.join(' ') || 'Windows PowerShell';
      win.setTitle(t);
    },
    color(arg) {
      const map = { green: '#16c60c', blue: '#3b78ff', red: '#e74856', white: '#cccccc', amber: '#f9f1a5' };
      if (!map[arg]) { print('color : choose green, blue, red, white or amber.', 'err'); return; }
      scroll.style.color = map[arg];
    },
    exit() { win.close(); },
    shutdown() { bus.emit('power:action', 'shutdown'); },
    restart() { bus.emit('power:action', 'restart'); },
    matrix() {
      print('Wake up…', 'ok');
      let i = 0;
      const t = setInterval(() => {
        print(Array.from({ length: 42 }, () => (Math.random() > .5 ? '1' : '0')).join(''), 'ok');
        if (++i > 8) clearInterval(t);
      }, 90);
    },
    curl(arg) { print(`curl : (6) Could not resolve host: ${arg || 'example.com'} — this internet is decorative.`, 'err'); },
    git() { print('fatal: not a git repository (or any of the parent directories): .git', 'err'); },
    'get-process'() { commands.tasklist(); },
    'get-date'() { commands.date(); },
  };

  function run(raw) {
    const cmdline = raw.trim();
    if (!cmdline) return;
    const parts = cmdline.match(/("[^"]*"|\S+)/g) || [];
    const cmd = parts[0].toLowerCase();
    const rest = parts.slice(1);
    if (commands[cmd]) {
      try { commands[cmd](...rest); }
      catch (err) { print(String(err), 'err'); }
    } else {
      print(`${cmd} : The term '${cmd}' is not recognized as the name of a cmdlet, function, script file, or operable program.`, 'err');
      print('Type "help" to see the commands that exist.', 'warn');
    }
  }

  print(BANNER);
  inputLine();

  win.body.addEventListener('pointerdown', () => {
    const inp = scroll.querySelector('input');
    if (inp && !window.getSelection().toString()) setTimeout(() => inp.focus(), 0);
  });

  return win;
}
