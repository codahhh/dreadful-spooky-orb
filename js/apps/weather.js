/* ============================================================
   Weather
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc } from '../utils.js';
import { notify } from '../notify.js';

export const meta = { id: 'weather', name: 'Weather', icon: 'weather' };

const DAYS = [
  { d: 'Today', t: 18, lo: 11, hi: 19, cond: 'Partly cloudy', ico: 'weather' },
  { d: 'Tomorrow', t: 16, lo: 10, hi: 17, cond: 'Light rain', ico: 'cloud' },
  { d: 'Friday', t: 15, lo: 9, hi: 16, cond: 'Showers', ico: 'cloud' },
  { d: 'Saturday', t: 19, lo: 12, hi: 21, cond: 'Sunny', ico: 'weather' },
  { d: 'Sunday', t: 21, lo: 13, hi: 23, cond: 'Sunny', ico: 'weather' },
  { d: 'Monday', t: 17, lo: 11, hi: 18, cond: 'Cloudy', ico: 'cloud' },
];

export function launch() {
  const win = createWindow({
    title: 'Weather', icon: 'weather', width: 560, height: 560,
    minWidth: 380, minHeight: 400, appId: 'weather', instanceKey: 'weather',
  });

  win.body.innerHTML = `
    <div class="weather">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div class="w-city">Paris, Île-de-France</div>
          <div class="w-temp">18°</div>
          <div class="w-desc">Partly cloudy · Feels like 17°</div>
        </div>
        <div style="opacity:.9;width:84px;height:84px">${icon('weather', 84)}</div>
      </div>
      <div class="w-stats">
        <div class="w-stat"><span>Wind</span>9 km/h NW</div>
        <div class="w-stat"><span>Humidity</span>64%</div>
        <div class="w-stat"><span>Visibility</span>16 km</div>
        <div class="w-stat"><span>Pressure</span>1018 mb</div>
      </div>
      <div style="font-size:12px;opacity:.7;margin-top:4px">7-day forecast</div>
      <div class="w-forecast">
        ${DAYS.map((d) => `<div class="w-day">
          <span style="opacity:.8">${d.d}</span>
          <span style="width:26px;height:26px;display:inline-flex">${icon(d.ico)}</span>
          <b>${d.t}°</b>
          <span style="opacity:.55;font-size:10px">${d.lo}° / ${d.hi}°</span>
        </div>`).join('')}
      </div>
      <div style="margin-top:auto;font-size:10.5px;opacity:.5">Weather data is decorative. The orb controls the climate.</div>
    </div>`;

  return win;
}
