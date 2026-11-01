# Windows 10 — in the browser

**Live:** https://windows10-in-browser.vercel.app

A complete, interactive Windows 10 desktop environment built from scratch with plain HTML, CSS and
JavaScript ES modules. No frameworks, no build step, no network calls — every icon is inline SVG and
every wallpaper ships with the repo.

Boot screen → lock screen → sign-in → desktop, with a real window manager, Start menu with live
tiles, search, action center, calendar flyout, notification toasts, context menus everywhere, a
dark/light theme with accent colours, and seventeen working apps sharing one in-memory file system
that survives a reload.

```bash
# any static server works — the site is the `public/` folder
python3 -m http.server 8080 -d public
# then open http://localhost:8080
```

Click or press Enter on the lock screen, then **Sign in** (any password).

---

## The shell

| Area | What works |
| --- | --- |
| **Boot & lock** | Windows-style boot with spinner, lock screen with clock/date, click-to-reveal sign-in, blurred backdrop, fade-out transition, lock (`Win+L`), sign out, sleep |
| **Desktop** | Double-click icons to open, drag icons anywhere (positions persist), marquee-free single selection, rename icons, delete to Recycle Bin, right-click desktop menu (view, sort, refresh, new folder/text file, personalise, display settings) |
| **Taskbar** | Pinned + running apps, active indicator, hover thumbnails, click to minimise/restore, right-click for window list + pin/unpin + close all, tray flyouts (network, volume, battery, hidden icons, language), clock with calendar, notification badge, **Show desktop** strip (click to minimise all, double-click to restore all) |
| **Start menu** | Live tiles (small/medium/wide, reorderable, unpinnable), all-apps list with search box, user avatar, Documents/Pictures shortcuts, settings, power menu, right-click any app for *Pin to Start / Pin to taskbar / Open* |
| **Search** | Full-text search over apps, files in the virtual file system and settings pages; arrow keys + Enter to launch |
| **Action center** | Notification history, quick actions (Wi-Fi, Bluetooth, Airplane, Night light, Focus assist, Brightness, Project), clear all, expand/collapse, per-notification dismiss |
| **Notifications** | Toast stack bottom-right with icon, title, body, optional action, auto-dismiss + manual close, persisted history |
| **Calendar** | Month grid with today highlighted, event dots, click a day to add an event, upcoming events list |
| **Context menus** | Nested submenus, separators, checkmarks, keyboard shortcuts hints, dark variant for the taskbar/Start menu |
| **Theming** | Light / dark, six accent colours, accent-on-taskbar toggle, transparency effects, six wallpapers (two hand-drawn SVG scenes + solid variants) |

## Window management

Drag by the title bar, resize from any of eight handles, double-click the title bar to maximise,
drag to a screen edge for **snap assist** (Aero-snap preview + fill-the-other-side picker), minimise
with an animation, and restore from the taskbar. Windows keep focus order, renormalise z-index,
mark themselves inactive when another window is focused or the desktop is clicked, and prompt before
closing with unsaved changes.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Win` (tap) | Start menu |
| `Win+A` / `Win+S` | Action center / Search |
| `Win+D` | Show desktop |
| `Win+E` | File Explorer |
| `Win+I` | Settings |
| `Win+L` | Lock |
| `Win+Tab` | Task view |
| `Win+←/→` | Snap left/right |
| `Win+↑/↓` | Maximise / minimise |
| `Alt+Tab` | Cycle windows |
| `Alt+F4` | Close focused window (Shut Down dialog on the desktop) |
| `Ctrl+Shift+Esc` | Task Manager |
| `Ctrl+Esc` | Start menu |
| `Esc` | Close flyouts, menus and dialogs |

## Apps

All seventeen apps are real, not screenshots, and share the same virtual file system
(`C:\Users\Alex` with Desktop, Documents, Downloads, Pictures, Music, Videos and Program Files).

- **File Explorer** — sidebar quick access, breadcrumb + back/forward/up, list & grid views, sorting, new folder/file, rename, delete, copy paths, open files with the right default app, drag-free selection, status bar
- **Notepad** — open/save/save-as into the VFS, word wrap, font size, status bar (line/column), find, unsaved-change prompts, `Ctrl+S`
- **Calculator** — standard/scientific, history, memory keys, keyboard input
- **Paint** — pen, eraser, line, rectangle, ellipse, flood-free fill colours, sizes, save as PNG into the VFS, clear
- **Settings** — System, Devices, Network, Personalisation (wallpaper, accent, theme, transparency, icon visibility), Accounts, Time & Language, Privacy, Update, About
- **Microsoft Edge** — tabs, address bar with a small set of fake-but-working pages (`about:home`, `settings`, `theverge`, search results…), back/forward/refresh
- **Terminal** — ~25 commands (`dir`, `cd`, `type`, `mkdir`, `echo`, `del`, `cls`, `help`, `whoami`, `systeminfo`, `ipconfig`, `ping`, `tasklist`, `neofetch`, `open <app>`, `calc`, `theme`, `exit`…), command history with ↑/↓
- **Task Manager** — live process list (CPU/memory per open app + system processes), end task, performance graphs, startup tab
- **Photos** — gallery from Pictures + saved images, viewer with zoom, next/prev, delete, set as wallpaper
- **Minesweeper** — real game: difficulty, flags, timer, first-click safety, win/lose states
- **Microsoft Store** — app catalogue with install buttons and progress, installed state, search
- **Media Player** — playlist, play/pause/next/prev, seek & volume via a simulated audio engine, visualiser
- **Recycle Bin** — restore or permanently delete, empty bin with confirmation
- **Mail** — inbox/sent/drafts, message reading pane, compose with send into Sent
- **Weather** — current conditions, hourly and 5-day forecast for a handful of cities
- **Calendar** — full month view with events, add/delete, today button
- **Get started** — welcome tour window shown on first sign-in

## Persistence

State is stored under `localStorage` key `win10os.state.v1` (debounced writes, flushed on
`pagehide`/tab hide): file system contents (text + images), recycle bin, settings (theme, accent,
wallpaper, taskbar pins, Start tiles, icon visibility), desktop icon positions, calendar events,
mail, notifications and installed Store apps. `win10os.seen` remembers the first-run tour.

Wipe everything from the console with `localStorage.clear()`.

## Project layout

```
public/index.html            shell markup (lockscreen, desktop, taskbar, flyouts, panels)
public/css/base.css          lock screen, desktop, wallpaper, common widgets
public/css/shell.css         taskbar, start menu, search, action center, calendar, window chrome
public/css/apps.css          per-app styles
public/js/main.js            bootstrap, global hotkeys, debug hook (window.__WIN10)
public/js/boot.js            boot → lock → sign-in sequence
public/js/store.js           persisted state, file system API, settings, wallpapers
public/js/wm.js              window manager: create/drag/resize/snap/minimise/z-order
public/js/taskbar.js         task buttons, previews, tray flyouts, clock
public/js/startmenu.js       Start menu + live tiles
public/js/search.js          search panel
public/js/actioncenter.js    notifications + quick actions
public/js/calendarflyout.js  taskbar calendar
public/js/contextmenu.js     nested context menus
public/js/notify.js          toast notifications
public/js/desktop.js         desktop icons, selection, drag, context menu
public/js/fileopen.js        default-app file opening
public/js/filedialog.js      open/save dialogs
public/js/apps/*.js          the seventeen apps + registry
public/assets/*.svg          wallpapers
vercel.json                  static deployment config (output: public/)
```

## Verification

- Every module bundles cleanly with `esbuild` (syntax/import check).
- A jsdom harness boots the whole shell headlessly, signs in, launches all 17 apps, drives
  calculator/terminal/explorer/paint/taskbar/Start menu/search/context menus and asserts **zero**
  console errors.
- A second harness performs a full save → reload → restore round-trip: theme, accent, wallpaper,
  desktop icon positions, file system contents and the first-run flag all come back correctly.
- CSS audit: balanced braces, no undefined custom properties, all 123 icon glyphs resolve.


## Deploying

The site is plain static files in `public/`, so `vercel.json` just points Vercel at that folder
(`"outputDirectory": "public"`) — no install, no build, nothing to compile. Pushing to a linked
branch and redeploying publishes the same files you run locally.

## Notes

- Everything is local: no external fonts, CDNs, analytics or requests of any kind.
- The VFS is in-memory + `localStorage`; images are stored as data URLs, so the quota is the limit.
  Store-heavy image use will trigger the automatic cleanup fallback in `store.js`.
- Designed for a desktop-sized viewport (≥1024×640); it degrades gracefully below that (Start menu
  and flyouts go full width, windows clamp to the viewport).
- `window.__WIN10` exposes `launchApp`, `state` and the event bus for poking at the shell from devtools.
