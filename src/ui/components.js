import { h } from './dom.js';
import { update, store } from '../store.js';
import { normaliserEtude } from '../core/model.js';

export const levelOptions = (scale) => scale.map((s) => ({ value: s.value, label: s.code ? `${s.code} – ${s.label}` : s.label }));

export function select({ value, options, onChange, ariaLabel, placeholder, className }) {
  return h('select', { class: className ?? 'input', 'aria-label': ariaLabel, onchange: (e) => onChange(e.target.value) },
    placeholder !== undefined ? h('option', { value: '', selected: value === '' || value == null }, placeholder) : null,
    options.map((o) => h('option', { value: o.value, selected: String(o.value) === String(value), title: o.title }, o.label)));
}

export function chips({ values, options, onToggle, empty = 'Aucun élément disponible' }) {
  if (!options.length) return h('span', { class: 'muted small' }, empty);
  return h('div', { class: 'chips' }, options.map((o) => {
    const on = values.includes(o.value);
    return h('button', {
      type: 'button', class: ['chip', on && 'chip-on'], 'aria-pressed': String(on), title: o.title ?? o.label,
      onclick: () => onToggle(o.value, !on),
    }, o.label);
  }));
}

export function badge(text, cls, title) {
  return h('span', { class: ['badge', cls], title }, text);
}

export function help(text) {
  return h('p', { class: 'help' }, text);
}

export function card(title, subtitle, ...children) {
  return h('section', { class: 'card' },
    title ? h('header', { class: 'card-head' }, h('h2', {}, title), subtitle ? h('p', { class: 'muted' }, subtitle) : null) : null,
    children);
}

/** Supprime un élément puis nettoie les références cassées via la normalisation. */
export function supprimer(mutator, libelle) {
  if (!confirm(`Supprimer ${libelle} ? Les références associées seront retirées.`)) return;
  update((e) => {
    mutator(e);
    store.etude = normaliserEtude(e).etude;
  });
}

/**
 * Tableau éditable générique.
 * columns: [{ key, label, type: text|textarea|select|level|chips|checkbox|computed, options, render, width }]
 */
export function editableTable({ items, columns, onAdd, addLabel, onRemove, emptyText = 'Aucun élément pour le moment.', caption }) {
  const cell = (item, col) => {
    const set = (val, render = true) => update(() => { item[col.key] = val; }, { render });
    switch (col.type) {
      case 'computed':
        return col.render(item);
      case 'textarea':
        return h('textarea', { class: 'input', rows: 2, value: item[col.key] ?? '', placeholder: col.placeholder ?? '', 'aria-label': col.label, oninput: (e) => set(e.target.value, false) });
      case 'select':
      case 'level': {
        const opts = typeof col.options === 'function' ? col.options(item) : col.options;
        return select({
          value: item[col.key], options: opts, ariaLabel: col.label, placeholder: col.placeholder,
          onChange: (v) => set(col.type === 'level' ? Number(v) : v),
        });
      }
      case 'chips': {
        const opts = typeof col.options === 'function' ? col.options(item) : col.options;
        return chips({
          values: item[col.key] ?? [], options: opts, empty: col.empty,
          onToggle: (v, on) => set(on ? [...(item[col.key] ?? []), v] : item[col.key].filter((x) => x !== v)),
        });
      }
      case 'checkbox':
        return h('input', { type: 'checkbox', checked: item[col.key], 'aria-label': col.label, onchange: (e) => set(e.target.checked) });
      default:
        return h('input', { class: 'input', type: 'text', value: item[col.key] ?? '', placeholder: col.placeholder ?? '', 'aria-label': col.label, maxlength: 4000, oninput: (e) => set(e.target.value, false) });
    }
  };

  return h('div', { class: 'table-wrap' },
    h('table', { class: 'table' },
      caption ? h('caption', {}, caption) : null,
      h('thead', {}, h('tr', {}, h('th', { class: 'col-id' }, 'Id'), columns.map((c) => h('th', { style: c.width || c.minWidth ? { width: c.width, minWidth: c.minWidth ?? c.width } : null, title: c.title }, c.label)), onRemove ? h('th', { class: 'col-actions' }, h('span', { class: 'sr-only' }, 'Actions')) : null)),
      h('tbody', {},
        items.length ? items.map((item) => h('tr', {},
          h('td', { class: 'col-id' }, h('code', {}, item.id)),
          columns.map((c) => h('td', { 'data-label': c.label }, cell(item, c))),
          onRemove ? h('td', { class: 'col-actions' }, h('button', { type: 'button', class: 'btn btn-ghost btn-danger', title: `Supprimer ${item.id}`, 'aria-label': `Supprimer ${item.id}`, onclick: () => onRemove(item) }, '✕')) : null,
        )) : h('tr', {}, h('td', { colspan: columns.length + 2, class: 'empty' }, emptyText)))),
    onAdd ? h('button', { type: 'button', class: 'btn btn-secondary', onclick: onAdd }, `+ ${addLabel ?? 'Ajouter'}`) : null);
}

export const vClass = (v) => (v == null ? 'lvl-na' : `lvl-v${v}`);
export const gClass = (g) => (g == null ? 'lvl-na' : `lvl-g${g}`);
export const riskClass = (n) => (n ? `risk-${n}` : 'lvl-na');
