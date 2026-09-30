// DOM helpers + one delegated event system. Markup declares intent with
//   data-action="name"  (click)       data-arg="value"
//   data-change="name"  (change)      data-input="name" (input)
//   data-enter="name"   (Enter key)   data-backdrop="name" (click on the element itself)
// and modules register handlers with actions({ name(arg, el, event) {...} }).

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const byId = id => document.getElementById(id);

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ESC[c]);

// Only http(s) links make it into href attributes.
export function safeUrl(url) {
  try {
    const u = new URL(url, location.href);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

const registry = {};
export function actions(map) {
  Object.assign(registry, map);
}

function dispatch(attr, e) {
  const el = e.target.closest(`[data-${attr}]`);
  if (!el) return;
  const name = el.dataset[attr];
  const fn = registry[name];
  if (!fn) { console.warn(`no action "${name}"`); return; }
  fn(el.dataset.arg, el, e);
}

export function installActions() {
  document.addEventListener('click', e => {
    const backdrop = e.target.dataset && e.target.dataset.backdrop;
    if (backdrop && registry[backdrop]) return registry[backdrop](undefined, e.target, e);
    // Plain links inside clickable rows just open; they don't also trigger the row.
    const link = e.target.closest('a[href]');
    if (link && !link.hasAttribute('data-action')) return;
    dispatch('action', e);
  });
  document.addEventListener('change', e => dispatch('change', e));
  document.addEventListener('input', e => dispatch('input', e));
  document.addEventListener('keydown', e => { if (e.key === 'Enter') dispatch('enter', e); });
}

export const show = (el, on = true) => { (typeof el === 'string' ? byId(el) : el).style.display = on ? '' : 'none'; };
export const setOpen = (id, on) => byId(id).classList.toggle('open', on);
