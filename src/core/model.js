/**
 * Modèle de données d'une étude EBIOS RM : création, validation/normalisation (import JSON),
 * migration depuis l'ancien format de l'outil et dérivation des risques.
 */
import { evaluerScenario, niveauRisque, SEUILS_RISQUE_DEFAUT, clamp } from './ebios.js';

export const SCHEMA_VERSION = 3;
const MAX_TXT = 4000;

export const SEUILS_MENACE_DEFAUT = Object.freeze({ danger: 3, controle: 1.5, veille: 0.5 });

export function etudeVide() {
  return {
    version: SCHEMA_VERSION,
    meta: { titre: 'Nouvelle étude', organisation: '', perimetre: '', auteur: '', date: new Date().toISOString().slice(0, 10) },
    parametres: { seuilsMenace: { ...SEUILS_MENACE_DEFAUT }, seuilsRisque: { ...SEUILS_RISQUE_DEFAUT } },
    atelier1: { valeursMetier: [], biensSupports: [], evenementsRedoutes: [], socle: [] },
    atelier2: { couples: [] },
    atelier3: { partiesPrenantes: [], scenariosStrategiques: [] },
    atelier4: { scenariosOperationnels: [] },
    atelier5: { traitements: {} },
  };
}

/** Prochain identifiant libre pour un préfixe donné (VM1, VM2…). */
export function nextId(items, prefix) {
  let max = 0;
  for (const it of items) {
    const m = String(it.id ?? '').match(new RegExp(`^${prefix}(\\d+)$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${max + 1}`;
}

export function nouvelleAction(actions, phase = 'connaitre') {
  return { id: nextId(actions, 'AE'), label: '', phase, pr: 2, diff: 2, predecesseurs: [], finale: false, justification: '' };
}

export function nouveauScenarioOperationnel(etude) {
  const sos = etude.atelier4.scenariosOperationnels;
  return {
    id: nextId(sos, 'SO'), ssId: etude.atelier3.scenariosStrategiques[0]?.id ?? '', titre: '',
    methode: 'avancee', expresse: { mode: 'direct', v: 2, pr: 2, diff: 2 },
    actions: [], correctionChaineLongue: true, sourceDeterminee: false,
  };
}

// ---------------------------------------------------------------------------
// Validation / normalisation
// ---------------------------------------------------------------------------

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const txt = (x, def = '') => (typeof x === 'string' ? x.slice(0, MAX_TXT) : typeof x === 'number' ? String(x) : def);
const bool = (x, def = false) => (typeof x === 'boolean' ? x : def);
const id = (x) => (typeof x === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(x) ? x : null);

function int(x, min, max, def, champ, erreurs) {
  const n = typeof x === 'string' && x.trim() !== '' ? Number(x) : x;
  if (Number.isInteger(n) && n >= min && n <= max) return n;
  if (x !== undefined && x !== null && x !== '') erreurs.push(`${champ} : valeur « ${x} » hors échelle [${min}-${max}], remplacée par ${def}.`);
  return def;
}

function num(x, def) {
  const n = Number(x);
  return Number.isFinite(n) && n >= 0 ? n : def;
}

function list(x, mapper, champ, erreurs) {
  if (x === undefined) return [];
  if (!Array.isArray(x)) { erreurs.push(`${champ} : une liste était attendue.`); return []; }
  const seen = new Set();
  const out = [];
  x.forEach((item, i) => {
    if (!isObj(item)) { erreurs.push(`${champ}[${i}] ignoré (objet attendu).`); return; }
    const mapped = mapper(item, `${champ}[${i}]`);
    if (!mapped.id) { erreurs.push(`${champ}[${i}] ignoré (identifiant invalide).`); return; }
    if (seen.has(mapped.id)) { erreurs.push(`${champ} : identifiant ${mapped.id} dupliqué, doublon ignoré.`); return; }
    seen.add(mapped.id);
    out.push(mapped);
  });
  return out;
}

const refs = (x, valid) => (Array.isArray(x) ? [...new Set(x.filter((r) => valid.has(r)))] : []);
const ref = (x, valid) => (valid.has(x) ? x : '');

/**
 * Valide et normalise une étude (typiquement issue d'un import JSON non fiable).
 * Renvoie { etude, erreurs } ; lève une erreur si le document est inexploitable.
 */
export function normaliserEtude(raw) {
  if (!isObj(raw)) throw new Error('Fichier invalide : un objet JSON était attendu.');
  if (Array.isArray(raw.steps)) return migrerAncienFormat(raw);
  if (raw.version !== undefined && raw.version > SCHEMA_VERSION) {
    throw new Error(`Version de fichier non prise en charge (${raw.version}).`);
  }

  const e = [];
  const base = etudeVide();
  const m = isObj(raw.meta) ? raw.meta : {};
  const p = isObj(raw.parametres) ? raw.parametres : {};
  const sm = isObj(p.seuilsMenace) ? p.seuilsMenace : {};
  const sr = isObj(p.seuilsRisque) ? p.seuilsRisque : {};
  const a1 = isObj(raw.atelier1) ? raw.atelier1 : {};
  const a2 = isObj(raw.atelier2) ? raw.atelier2 : {};
  const a3 = isObj(raw.atelier3) ? raw.atelier3 : {};
  const a4 = isObj(raw.atelier4) ? raw.atelier4 : {};
  const a5 = isObj(raw.atelier5) ? raw.atelier5 : {};

  const etude = {
    version: SCHEMA_VERSION,
    meta: {
      titre: txt(m.titre, base.meta.titre), organisation: txt(m.organisation), perimetre: txt(m.perimetre),
      auteur: txt(m.auteur), date: txt(m.date, base.meta.date),
    },
    parametres: {
      seuilsMenace: {
        danger: num(sm.danger, SEUILS_MENACE_DEFAUT.danger),
        controle: num(sm.controle, SEUILS_MENACE_DEFAUT.controle),
        veille: num(sm.veille, SEUILS_MENACE_DEFAUT.veille),
      },
      seuilsRisque: {
        moyen: int(sr.moyen, 1, 9, SEUILS_RISQUE_DEFAUT.moyen, 'Seuil risque moyen', e),
        eleve: int(sr.eleve, 1, 9, SEUILS_RISQUE_DEFAUT.eleve, 'Seuil risque élevé', e),
      },
    },
  };

  const vm = list(a1.valeursMetier, (x) => ({ id: id(x.id), nom: txt(x.nom), nature: txt(x.nature), description: txt(x.description) }), 'Valeurs métier', e);
  const vmIds = new Set(vm.map((x) => x.id));
  const bs = list(a1.biensSupports, (x) => ({ id: id(x.id), nom: txt(x.nom), valeurMetierIds: refs(x.valeurMetierIds, vmIds), responsable: txt(x.responsable) }), 'Biens supports', e);
  const er = list(a1.evenementsRedoutes, (x, c) => ({ id: id(x.id), valeurMetierId: ref(x.valeurMetierId, vmIds), description: txt(x.description), impacts: txt(x.impacts), gravite: int(x.gravite, 1, 4, 2, `${c}.gravité`, e) }), 'Événements redoutés', e);
  const socle = list(a1.socle, (x) => ({ id: id(x.id), referentiel: txt(x.referentiel), statut: ['applique', 'restrictions', 'non_applique'].includes(x.statut) ? x.statut : 'non_applique', ecarts: txt(x.ecarts) }), 'Socle', e);
  etude.atelier1 = { valeursMetier: vm, biensSupports: bs, evenementsRedoutes: er, socle };

  const couples = list(a2.couples, (x, c) => ({ id: id(x.id), source: txt(x.source), objectif: txt(x.objectif), motivation: int(x.motivation, 1, 3, 2, `${c}.motivation`, e), ressources: int(x.ressources, 1, 3, 2, `${c}.ressources`, e), retenu: bool(x.retenu, true) }), 'Couples SR/OV', e);
  etude.atelier2 = { couples };

  const coupleIds = new Set(couples.map((x) => x.id));
  const erIds = new Set(er.map((x) => x.id));
  const pp = list(a3.partiesPrenantes, (x, c) => ({
    id: id(x.id), nom: txt(x.nom), categorie: txt(x.categorie),
    dependance: int(x.dependance, 1, 4, 2, `${c}.dépendance`, e), penetration: int(x.penetration, 1, 4, 2, `${c}.pénétration`, e),
    maturite: int(x.maturite, 1, 4, 2, `${c}.maturité`, e), confiance: int(x.confiance, 1, 4, 2, `${c}.confiance`, e),
    sansConfiance: bool(x.sansConfiance),
  }), 'Parties prenantes', e);
  const ppIds = new Set(pp.map((x) => x.id));
  const ss = list(a3.scenariosStrategiques, (x) => ({ id: id(x.id), coupleId: ref(x.coupleId, coupleIds), description: txt(x.description), evenementIds: refs(x.evenementIds, erIds), ppIds: refs(x.ppIds, ppIds) }), 'Scénarios stratégiques', e);
  etude.atelier3 = { partiesPrenantes: pp, scenariosStrategiques: ss };

  const ssIds = new Set(ss.map((x) => x.id));
  const so = list(a4.scenariosOperationnels, (x, c) => {
    const ex = isObj(x.expresse) ? x.expresse : {};
    const actions = list(x.actions, (a, ca) => ({
      id: id(a.id), label: txt(a.label), phase: ['connaitre', 'rentrer', 'trouver', 'exploiter'].includes(a.phase) ? a.phase : 'connaitre',
      pr: int(a.pr, 0, 4, 2, `${ca}.probabilité`, e), diff: int(a.diff, 0, 4, 2, `${ca}.difficulté`, e),
      predecesseurs: Array.isArray(a.predecesseurs) ? a.predecesseurs.filter((r) => id(r)) : [],
      finale: bool(a.finale), justification: txt(a.justification),
    }), `${c}.actions`, e);
    const aIds = new Set(actions.map((a) => a.id));
    actions.forEach((a) => {
      const kept = a.predecesseurs.filter((r) => aIds.has(r) && r !== a.id);
      if (kept.length !== a.predecesseurs.length) e.push(`${c} : antécédents inconnus retirés de ${a.id}.`);
      a.predecesseurs = [...new Set(kept)];
    });
    return {
      id: id(x.id), ssId: ref(x.ssId, ssIds), titre: txt(x.titre),
      methode: ['expresse', 'standard', 'avancee'].includes(x.methode) ? x.methode : 'avancee',
      expresse: { mode: ex.mode === 'croise' ? 'croise' : 'direct', v: int(ex.v, 0, 4, 2, `${c}.V`, e), pr: int(ex.pr, 0, 4, 2, `${c}.Pr`, e), diff: int(ex.diff, 0, 4, 2, `${c}.Diff`, e) },
      actions, correctionChaineLongue: bool(x.correctionChaineLongue, true), sourceDeterminee: bool(x.sourceDeterminee),
    };
  }, 'Scénarios opérationnels', e);
  etude.atelier4 = { scenariosOperationnels: so };

  const soIds = new Set(so.map((x) => x.id));
  const traitements = {};
  if (isObj(a5.traitements)) {
    for (const [k, t] of Object.entries(a5.traitements)) {
      if (!soIds.has(k) || !isObj(t)) continue;
      traitements[k] = {
        option: ['reduire', 'accepter', 'transferer', 'refuser'].includes(t.option) ? t.option : 'reduire',
        mesures: txt(t.mesures), responsable: txt(t.responsable), echeance: txt(t.echeance),
        graviteResiduelle: t.graviteResiduelle == null ? null : int(t.graviteResiduelle, 1, 4, null, `Traitement ${k}.gravité résiduelle`, e),
        vraisemblanceResiduelle: t.vraisemblanceResiduelle == null ? null : int(t.vraisemblanceResiduelle, 0, 4, null, `Traitement ${k}.vraisemblance résiduelle`, e),
      };
    }
  }
  etude.atelier5 = { traitements };
  return { etude, erreurs: e };
}

/**
 * Migration depuis le format v2 de l'outil (4 étapes avec probabilité, difficulté et « socle »).
 * Le socle n'est pas un modificateur de vraisemblance en EBIOS RM : il est ignoré et signalé.
 */
export function migrerAncienFormat(raw) {
  const etude = etudeVide();
  const erreurs = ['Ancien format (v2) détecté : converti en un scénario opérationnel linéaire (méthode avancée).'];
  const phases = ['connaitre', 'rentrer', 'trouver', 'exploiter'];
  const actions = raw.steps.slice(0, 20).map((s, i) => ({
    id: `AE${i + 1}`, label: txt(s?.name, `Étape ${i + 1}`), phase: phases[Math.min(i, 3)],
    pr: clamp(Number.isInteger(s?.prob) ? s.prob : 2), diff: clamp(Number.isInteger(s?.diff) ? s.diff : 2),
    predecesseurs: i ? [`AE${i}`] : [], finale: i === raw.steps.length - 1, justification: '',
  }));
  if (raw.steps.some((s) => s?.socle)) {
    erreurs.push('Le « socle » par étape a été ignoré : en EBIOS RM, les mesures existantes se reflètent dans la cotation de la probabilité et de la difficulté.');
  }
  etude.meta.titre = 'Étude importée (ancien format)';
  etude.atelier4.scenariosOperationnels.push({
    id: 'SO1', ssId: '', titre: 'Scénario importé', methode: 'avancee', expresse: { mode: 'direct', v: 2, pr: 2, diff: 2 },
    actions, correctionChaineLongue: true, sourceDeterminee: false,
  });
  return { etude, erreurs };
}

// ---------------------------------------------------------------------------
// Dérivations
// ---------------------------------------------------------------------------

/** Gravité d'un scénario stratégique = gravité maximale des événements redoutés associés. */
export function graviteScenarioStrategique(etude, ss) {
  const gs = etude.atelier1.evenementsRedoutes.filter((er) => ss?.evenementIds.includes(er.id)).map((er) => er.gravite);
  return gs.length ? Math.max(...gs) : null;
}

/** Un risque par scénario opérationnel : gravité (atelier 3) × vraisemblance (atelier 4), initial et résiduel. */
export function deriverRisques(etude) {
  const seuils = etude.parametres.seuilsRisque;
  return etude.atelier4.scenariosOperationnels.map((so, i) => {
    const ss = etude.atelier3.scenariosStrategiques.find((s) => s.id === so.ssId);
    const couple = etude.atelier2.couples.find((c) => c.id === ss?.coupleId);
    const evaluation = evaluerScenario(so);
    const gravite = graviteScenarioStrategique(etude, ss);
    const vraisemblance = evaluation.v;
    const t = etude.atelier5.traitements[so.id] ?? null;
    const gRes = t?.graviteResiduelle ?? gravite;
    const vRes = t?.vraisemblanceResiduelle ?? vraisemblance;
    const complet = gravite != null && vraisemblance != null;
    return {
      id: `R${i + 1}`, soId: so.id, ssId: ss?.id ?? null,
      titre: so.titre || ss?.description || so.id,
      source: couple ? `${couple.source} → ${couple.objectif}` : '',
      gravite, vraisemblance, evaluation,
      niveau: complet ? niveauRisque(gravite, vraisemblance, seuils) : null,
      traitement: t,
      graviteResiduelle: gRes, vraisemblanceResiduelle: vRes,
      niveauResiduel: gRes != null && vRes != null ? niveauRisque(gRes, vRes, seuils) : null,
    };
  });
}

/** Contrôles de cohérence affichés dans l'interface. */
export function controlesCoherence(etude) {
  const w = [];
  const { atelier1: a1, atelier2: a2, atelier3: a3, atelier4: a4 } = etude;
  if (!a1.valeursMetier.length) w.push({ atelier: 1, msg: 'Aucune valeur métier définie.' });
  a1.evenementsRedoutes.filter((x) => !x.valeurMetierId).forEach((x) => w.push({ atelier: 1, msg: `${x.id} n'est rattaché à aucune valeur métier.` }));
  if (!a2.couples.some((c) => c.retenu)) w.push({ atelier: 2, msg: 'Aucun couple SR/OV retenu.' });
  a3.scenariosStrategiques.forEach((s) => {
    if (!s.coupleId) w.push({ atelier: 3, msg: `${s.id} : aucun couple SR/OV associé.` });
    if (!s.evenementIds.length) w.push({ atelier: 3, msg: `${s.id} : aucun événement redouté, gravité non calculable.` });
  });
  a4.scenariosOperationnels.forEach((so) => {
    if (!so.ssId) w.push({ atelier: 4, msg: `${so.id} : aucun scénario stratégique associé.` });
    evaluerScenario(so).avertissements.forEach((msg) => w.push({ atelier: 4, msg: `${so.id} : ${msg}` }));
  });
  return w;
}
