/* Small indirection so apps can launch other apps without circular imports */
let _launcher = null;
export function setLauncher(fn) { _launcher = fn; }
export function openApp(id, args = {}) {
  if (_launcher) return _launcher(id, args);
  console.warn('launcher not ready', id);
}
