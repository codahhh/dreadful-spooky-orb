/* ============================================================
   App registry
   ============================================================ */

import * as explorer from './explorer.js';
import * as notepad from './notepad.js';
import * as calculator from './calculator.js';
import * as paint from './paint.js';
import * as settings from './settings.js';
import * as edge from './edge.js';
import * as terminal from './terminal.js';
import * as taskmanager from './taskmanager.js';
import * as photos from './photos.js';
import * as minesweeper from './minesweeper.js';
import * as store from './store.js';
import * as media from './media.js';
import * as recycle from './recycle.js';
import * as mail from './mail.js';
import * as weather from './weather.js';
import * as calendar from './calendar.js';
import * as welcome from './welcome.js';

import { setLauncher } from '../launcher.js';

const MODULES = {
  explorer, notepad, calculator, paint, settings, edge, terminal, taskmanager,
  photos, minesweeper, store, media, recycle, mail, weather, calendar, welcome,
};

export function allApps() {
  return Object.values(MODULES).map((m) => m.meta);
}

export function appMeta(id) {
  return MODULES[id]?.meta || null;
}

export function launchApp(id, args = {}) {
  const mod = MODULES[id];
  if (!mod) {
    console.warn('unknown app', id);
    return null;
  }
  return mod.launch(args);
}

setLauncher(launchApp);
