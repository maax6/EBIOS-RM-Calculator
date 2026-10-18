import './styles.css';
import { h, mount, download } from './ui/dom.js';
import { store, subscribe, setStore, remplacerEtude, notify } from './store.js';
import { etudeVide, normaliserEtude, controlesCoherence, deriverRisques } from './core/model.js';
import { etudeExemple } from './core/exemple.js';
import { toJSON, risquesToCSV } from './core/export.js';
import { viewAtelier1 } from './ui/views/atelier1.js';
import { viewAtelier2 } from './ui/views/atelier2.js';
import { viewAtelier3 } from './ui/views/atelier3.js';
import { viewAtelier4 } from './ui/views/atelier4.js';
import { viewAtelier5 } from './ui/views/atelier5.js';
import { viewRapport } from './ui/views/rapport.js';

const VUES = [
  { id: 'cadrage', num: 1, titre: 'Cadrage & socle', view: viewAtelier1 },
  { id: 'sources', num: 2, titre: 'Sources de risque', view: viewAtelier2 },
  { id: 'strategiques', num: 3, titre: 'Scénarios stratégiques', view: viewAtelier3 },
  { id: 'operationnels', num: 4, titre: 'Scénarios opérationnels', view: viewAtelier4 },
  { id: 'traitement', num: 5, titre: 'Traitement du risque', view: viewAtelier5 },
  { id: 'rapport', num: null, titre: 'Rapport', view: viewRapport },
];

const slug = (s) => (s || 'etude').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 50);

function importer() {
  const input = h('input', { type: 'file', accept: 'application/json,.json' });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Fichier trop volumineux (5 Mo maximum).'); return; }
    try {
      const { etude, erreurs } = normaliserEtude(JSON.parse(await file.text()));
      remplacerEtude(etude, erreurs.length ? [`Import de « ${file.name} » : ${erreurs.length} correction(s) appliquée(s).`, ...erreurs.slice(0, 8)] : [`« ${file.name} » importé.`]);
    } catch (err) {
      alert(`Import impossible : ${err.message}`);
    }
  });
  input.click();
}

function actions() {
  const e = store.etude;
  return h('div', { class: 'toolbar' },
    h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => { if (confirm('Créer une nouvelle étude vide ? L’étude actuelle sera remplacée (pensez à l’exporter).')) remplacerEtude(etudeVide()); } }, 'Nouvelle'),
    h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => { if (confirm('Charger l’étude d’exemple ? L’étude actuelle sera remplacée.')) remplacerEtude(etudeExemple(), ['Étude d’exemple chargée (inspirée du guide ANSSI).']); } }, 'Exemple'),
    h('button', { type: 'button', class: 'btn btn-ghost', onclick: importer }, 'Importer'),
    h('span', { class: 'toolbar-sep' }),
    h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => download(`${slug(e.meta.titre)}.ebios.json`, toJSON(e), 'application/json') }, 'JSON'),
    h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => download(`${slug(e.meta.titre)}-risques.csv`, risquesToCSV(deriverRisques(e)), 'text/csv;charset=utf-8') }, 'CSV'),
    h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { setStore({ vue: 'rapport' }); setTimeout(() => window.print(), 50); } }, 'Imprimer / PDF'),
    h('button', { type: 'button', class: 'btn btn-ghost', 'aria-label': 'Changer de thème', title: 'Thème clair / sombre', onclick: () => {
      const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = t;
      localStorage.setItem('ebios-rm-calculator:theme', t);
    } }, '◐'));
}

function render() {
  const e = store.etude;
  const warnings = controlesCoherence(e);
  const vue = VUES.find((v) => v.id === store.vue) ?? VUES[0];
  const app = document.getElementById('app');

  mount(app,
    h('header', { class: 'topbar' },
      h('div', { class: 'brand' },
        h('div', { class: 'logo', 'aria-hidden': 'true' }, 'RM'),
        h('div', {}, h('div', { class: 'brand-title' }, 'EBIOS RM Calculator'), h('div', { class: 'brand-sub' }, e.meta.titre || 'Étude sans titre'))),
      actions()),
    h('nav', { class: 'tabs', 'aria-label': 'Ateliers EBIOS RM' },
      VUES.map((v) => {
        const n = warnings.filter((w) => w.atelier === v.num).length;
        return h('button', { type: 'button', class: ['tab', v.id === vue.id && 'tab-on'], 'aria-current': v.id === vue.id ? 'page' : null, onclick: () => setStore({ vue: v.id }) },
          v.num ? h('span', { class: 'tab-num' }, v.num) : h('span', { class: 'tab-num' }, '≡'),
          h('span', {}, v.titre),
          n ? h('span', { class: 'tab-warn', title: `${n} point(s) de vigilance` }, n) : null);
      })),
    store.notices.length ? h('div', { class: 'notice', role: 'status' },
      h('ul', {}, store.notices.map((n) => h('li', {}, n))),
      h('button', { type: 'button', class: 'btn btn-ghost', 'aria-label': 'Fermer', onclick: () => setStore({ notices: [] }) }, '✕')) : null,
    h('main', { class: 'content', id: 'main' },
      vue.view(e),
      vue.num && warnings.some((w) => w.atelier === vue.num)
        ? h('section', { class: 'card card-warn' }, h('h3', {}, 'Points de vigilance'), h('ul', {}, warnings.filter((w) => w.atelier === vue.num).map((w) => h('li', {}, w.msg))))
        : null),
    h('footer', { class: 'footer' },
      h('span', { id: 'save-status' }, 'Enregistrement automatique dans ce navigateur'),
      h('span', {}, 'Outil non officiel – méthode ', h('a', { href: 'https://cyber.gouv.fr/la-methode-ebios-risk-manager', target: '_blank', rel: 'noopener' }, 'EBIOS Risk Manager (ANSSI)'))));
}

document.addEventListener('ebios:saved', () => {
  const el = document.getElementById('save-status');
  if (el) el.textContent = `Enregistré localement à ${store.dernierEnregistrement.toLocaleTimeString('fr-FR')}`;
});

const theme = localStorage.getItem('ebios-rm-calculator:theme');
if (theme) document.documentElement.dataset.theme = theme;

subscribe(render);
store.soActif = store.etude.atelier4.scenariosOperationnels[0]?.id ?? null;
notify();
