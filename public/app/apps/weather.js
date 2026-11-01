/* ============================================================
   Weather
   ============================================================ */

import { createWindow } from '../wm.js';
import { icon } from '../icons.js';
import { el, esc } from '../utils.js';

export const meta = { id: 'weather', name: 'Weather', icon: 'weather' };

/* Each city has a base temperature, a condition and a character. The forecast
   is generated deterministically from the city + the date, so it is stable
   across reloads without needing a network. */
const CITIES = [
  {
    id: 'paris', name: 'Paris', region: 'Île-de-France', country: 'France',
    temp: 18, lo: 11, hi: 19, cond: 'Partly cloudy', ico: 'weather',
    wind: '9 km/h NW', humidity: 64, visibility: '16 km', pressure: '1018 mb', uv: 3, aq: 42,
  },
  {
    id: 'london', name: 'London', region: 'England', country: 'United Kingdom',
    temp: 13, lo: 8, hi: 14, cond: 'Light drizzle', ico: 'cloud',
    wind: '17 km/h W', humidity: 82, visibility: '9 km', pressure: '1004 mb', uv: 1, aq: 38,
  },
  {
    id: 'tokyo', name: 'Tokyo', region: 'Kantō', country: 'Japan',
    temp: 24, lo: 19, hi: 26, cond: 'Clear', ico: 'weather',
    wind: '6 km/h S', humidity: 51, visibility: '24 km', pressure: '1022 mb', uv: 7, aq: 55,
  },
  {
    id: 'newyork', name: 'New York', region: 'New York', country: 'United States',
    temp: 21, lo: 15, hi: 23, cond: 'Mostly sunny', ico: 'weather',
    wind: '12 km/h SE', humidity: 47, visibility: '20 km', pressure: '1015 mb', uv: 5, aq: 47,
  },
  {
    id: 'reykjavik', name: 'Reykjavík', region: 'Capital Region', country: 'Iceland',
    temp: 3, lo: -1, hi: 5, cond: 'Snow showers', ico: 'cloud',
    wind: '31 km/h N', humidity: 88, visibility: '5 km', pressure: '996 mb', uv: 0, aq: 12,
  },
  {
    id: 'sydney', name: 'Sydney', region: 'New South Wales', country: 'Australia',
    temp: 27, lo: 20, hi: 30, cond: 'Sunny', ico: 'weather',
    wind: '14 km/h NE', humidity: 44, visibility: '30 km', pressure: '1026 mb', uv: 9, aq: 24,
  },
  {
    id: 'cairo', name: 'Cairo', region: 'Cairo Governorate', country: 'Egypt',
    temp: 33, lo: 25, hi: 36, cond: 'Hazy sun', ico: 'weather',
    wind: '19 km/h N', humidity: 21, visibility: '7 km', pressure: '1010 mb', uv: 10, aq: 96,
  },
];

const CONDITIONS = [
  { cond: 'Sunny', ico: 'weather' },
  { cond: 'Partly cloudy', ico: 'weather' },
  { cond: 'Overcast', ico: 'cloud' },
  { cond: 'Light rain', ico: 'cloud' },
  { cond: 'Showers', ico: 'cloud' },
  { cond: 'Clear', ico: 'weather' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* deterministic pseudo random from a string + index */
function rand(seed, i) {
  let h = 2166136261;
  const str = seed + ':' + i;
  for (let k = 0; k < str.length; k++) { h ^= str.charCodeAt(k); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

function forecastFor(city, offset) {
  const r = rand(city.id + city.temp, offset);
  const c = CONDITIONS[Math.floor(r * CONDITIONS.length) % CONDITIONS.length];
  const drift = Math.round((r - 0.5) * 6);
  return {
    t: city.temp + drift,
    lo: city.lo + drift - 1,
    hi: city.hi + drift + 1,
    cond: c.cond,
    ico: c.ico,
  };
}

function sunriseSunset(city) {
  const r = rand(city.id + 'sun', 7);
  const rise = 5 + Math.round(r * 3);
  const set = 18 + Math.round(r * 4);
  const fmt = (h) => `${String(h).padStart(2, '0')}:${String(Math.round(rand(city.id, h) * 59)).padStart(2, '0')}`;
  return { rise: fmt(rise), set: fmt(set) };
}

const toF = (c) => Math.round(c * 9 / 5 + 32);
const show = (c, unit) => `${unit === 'F' ? toF(c) : c}°`;

export function launch(args = {}) {
  const win = createWindow({
    title: 'Weather', icon: 'weather', width: 640, height: 660,
    minWidth: 360, minHeight: 420, appId: 'weather', instanceKey: 'weather',
  });

  let cityIdx = Math.max(0, CITIES.findIndex((c) => c.id === (args.city || 'paris')));
  let unit = 'C';
  let dayIdx = 0;

  function render() {
    const city = CITIES[cityIdx];
    const unitToggle = unit === 'C' ? '°C' : '°F';
    const days = Array.from({ length: 7 }, (_, i) => ({
      ...forecastFor(city, i),
      label: i === 0 ? 'Today'
        : i === 1 ? 'Tomorrow'
          : DAY_NAMES[(new Date().getDay() + i) % 7],
      key: i,
    }));
    const sh = sunriseSunset(city);

    /* hourly: 24 slots starting at the current hour, coolest before sunrise */
    const nowH = new Date().getHours();
    const hours = Array.from({ length: 12 }, (_, i) => {
      const h = (nowH + i) % 24;
      const r = rand(city.id + 'h', h);
      const swing = Math.sin(((h - 4) / 24) * Math.PI * 2) * 5;
      const t = Math.round(city.temp + swing + (r - 0.5) * 3);
      return {
        h, t,
        ico: (h >= 20 || h <= 6) ? 'nightlight' : (r > 0.7 ? 'cloud' : 'weather'),
        label: i === 0 ? 'Now' : `${String(h).padStart(2, '0')}:00`,
      };
    });

    win.setTitle(`Weather — ${city.name}`);

    win.body.innerHTML = `
      <div class="weather" style="display:flex;flex-direction:column;gap:12px;height:100%;overflow:auto;padding:14px 16px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <select id="wx-city" class="btn" style="height:26px;padding:0 8px;font-size:12px;max-width:210px">
            ${CITIES.map((c, i) => `<option value="${i}" ${i === cityIdx ? 'selected' : ''}>${esc(c.name)}, ${esc(c.country)}</option>`).join('')}
          </select>
          <button class="btn" id="wx-unit" style="height:26px;padding:0 10px;font-size:12px" title="Toggle units">${unitToggle}</button>
          <button class="btn" id="wx-refresh" style="height:26px;padding:0 10px;font-size:12px" title="Next city">${icon('refresh')} Next city</button>
          <span style="margin-left:auto;font-size:10.5px;opacity:.5">updated just now</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
          <div>
            <div class="w-city">${esc(city.name)}, ${esc(city.region)}</div>
            <div class="w-temp">${show(days[dayIdx].t, unit)}</div>
            <div class="w-desc">${esc(days[dayIdx].cond)} · Feels like ${show(days[dayIdx].t - 1, unit)}</div>
            <div style="font-size:11px;opacity:.6;margin-top:2px">${esc(city.country)} · ${days[dayIdx].label}</div>
          </div>
          <div style="opacity:.92;width:88px;height:88px;flex:0 0 88px">${icon(days[dayIdx].ico, 88)}</div>
        </div>

        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:2px">
          ${hours.map((h) => `<div style="flex:0 0 auto;width:60px;text-align:center;border:1px solid var(--line);border-radius:4px;padding:6px 2px;font-size:11px">
            <div style="opacity:.65">${h.label}</div>
            <div style="width:22px;height:22px;margin:4px auto;display:flex">${icon(h.ico)}</div>
            <b style="font-size:12.5px">${show(h.t, unit)}</b>
          </div>`).join('')}
        </div>

        <div class="w-stats">
          <div class="w-stat"><span>Wind</span>${esc(city.wind)}</div>
          <div class="w-stat"><span>Humidity</span>${city.humidity}%</div>
          <div class="w-stat"><span>Visibility</span>${esc(city.visibility)}</div>
          <div class="w-stat"><span>Pressure</span>${esc(city.pressure)}</div>
          <div class="w-stat"><span>UV index</span>${city.uv}</div>
          <div class="w-stat"><span>Air quality</span>${city.aq}${city.aq < 50 ? ' · good' : city.aq < 80 ? ' · fair' : ' · poor'}</div>
          <div class="w-stat"><span>Sunrise</span>${sh.rise}</div>
          <div class="w-stat"><span>Sunset</span>${sh.set}</div>
        </div>

        <div style="font-size:12px;opacity:.7">7-day forecast</div>
        <div class="w-forecast">
          ${days.map((d) => `<button class="w-day" data-day="${d.key}" style="border:0;background:${d.key === dayIdx ? 'rgba(0,120,215,.14)' : 'transparent'};color:inherit;cursor:default;text-align:left">
            <span style="opacity:.8">${esc(d.label)}</span>
            <span style="width:26px;height:26px;display:inline-flex">${icon(d.ico)}</span>
            <b>${show(d.t, unit)}</b>
            <span style="opacity:.55;font-size:10px">${show(d.lo, unit)} / ${show(d.hi, unit)}</span>
          </button>`).join('')}
        </div>

        <div style="margin-top:auto;font-size:10.5px;opacity:.5">Weather data is decorative. The orb controls the climate.</div>
      </div>`;

    win.body.querySelector('#wx-city').addEventListener('change', (e) => {
      cityIdx = +e.target.value; dayIdx = 0; render();
    });
    win.body.querySelector('#wx-unit').addEventListener('click', () => { unit = unit === 'C' ? 'F' : 'C'; render(); });
    win.body.querySelector('#wx-refresh').addEventListener('click', () => {
      cityIdx = (cityIdx + 1) % CITIES.length; dayIdx = 0; render();
    });
    win.body.querySelectorAll('[data-day]').forEach((b) => b.addEventListener('click', () => {
      dayIdx = +b.dataset.day; render();
    }));
  }

  render();
  return win;
}
