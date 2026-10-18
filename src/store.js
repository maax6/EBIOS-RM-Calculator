/** État de l'application + persistance locale (localStorage). */
import { etudeVide, normaliserEtude } from './core/model.js';

const KEY = 'ebios-rm-calculator:etude:v3';
const listeners = new Set();

function charger() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normaliserEtude(JSON.parse(raw)).etude;
  } catch (err) {
    console.warn('Sauvegarde locale illisible, nouvelle étude créée.', err);
  }
  return null;
}

export const store = {
  etude: charger() ?? etudeVide(),
  vue: 'cadrage',
  soActif: null,
  dernierEnregistrement: null,
  notices: [],
};

let timer = null;
export function sauvegarder() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(store.etude));
      store.dernierEnregistrement = new Date();
      document.dispatchEvent(new CustomEvent('ebios:saved'));
    } catch (err) {
      console.error('Impossible d’enregistrer localement', err);
    }
  }, 250);
}

/** Modifie l'étude, sauvegarde, et redessine (sauf `{ render: false }` pour la saisie de texte). */
export function update(mutator, { render = true } = {}) {
  mutator(store.etude);
  sauvegarder();
  if (render) notify();
}

export function setStore(patch) {
  Object.assign(store, patch);
  notify();
}

export function remplacerEtude(etude, notices = []) {
  store.etude = etude;
  store.soActif = etude.atelier4.scenariosOperationnels[0]?.id ?? null;
  store.notices = notices;
  sauvegarder();
  notify();
}

export const subscribe = (fn) => listeners.add(fn);
export const notify = () => listeners.forEach((fn) => fn(store));
