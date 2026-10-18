/**
 * Moteur de calcul EBIOS Risk Manager.
 *
 * Fonctions pures, sans dépendance au DOM : elles sont testées unitairement (tests/ebios.test.js).
 * Les références renvoient aux fiches méthodes de l'ANSSI (cf. README).
 */
import { MATRICE_VRAISEMBLANCE, MATRICE_PERTINENCE } from './scales.js';

export const MIN_LEVEL = 0;
export const MAX_LEVEL = 4;
/** Longueur de séquence à partir de laquelle l'ANSSI suggère une correction (« environ une dizaine »). */
export const SEUIL_CHAINE_LONGUE = 10;
/** Garde-fou contre l'explosion combinatoire des modes opératoires. */
export const MAX_MODES = 500;

export const clamp = (v, min = MIN_LEVEL, max = MAX_LEVEL) => Math.min(max, Math.max(min, v));

function assertLevel(v, name, min = MIN_LEVEL, max = MAX_LEVEL) {
  if (!Number.isInteger(v) || v < min || v > max) {
    throw new RangeError(`${name} doit être un entier entre ${min} et ${max} (reçu : ${v})`);
  }
}

// ---------------------------------------------------------------------------
// Atelier 2 – Pertinence d'un couple SR/OV
// ---------------------------------------------------------------------------

/** Pertinence (1 faible, 2 moyenne, 3 élevée) à partir de la motivation et des ressources (1 à 3). */
export function pertinenceSROV(motivation, ressources) {
  assertLevel(motivation, 'motivation', 1, 3);
  assertLevel(ressources, 'ressources', 1, 3);
  return MATRICE_PERTINENCE[motivation - 1][ressources - 1];
}

// ---------------------------------------------------------------------------
// Atelier 3 – Menace des parties prenantes
// ---------------------------------------------------------------------------

/**
 * Niveau de menace d'une partie prenante :
 *   (Dépendance × Pénétration) / (Maturité cyber × Confiance), chaque critère coté de 1 à 4.
 * Si `sansConfiance` est vrai (PP utilisée à ses dépens comme simple intermédiaire), le critère de
 * confiance est retiré de la formule, comme le permet la fiche méthode 5.
 */
export function niveauMenace({ dependance, penetration, maturite, confiance }, { sansConfiance = false } = {}) {
  assertLevel(dependance, 'dépendance', 1, 4);
  assertLevel(penetration, 'pénétration', 1, 4);
  assertLevel(maturite, 'maturité', 1, 4);
  if (!sansConfiance) assertLevel(confiance, 'confiance', 1, 4);
  const denominateur = maturite * (sansConfiance ? 1 : confiance);
  return Math.round(((dependance * penetration) / denominateur) * 100) / 100;
}

/** Zone de menace selon les seuils fixés par la gouvernance projet. */
export function zoneMenace(niveau, { danger, controle, veille }) {
  if (niveau >= danger) return 'danger';
  if (niveau >= controle) return 'controle';
  if (niveau >= veille) return 'veille';
  return 'hors';
}

/**
 * Seuils par défaut proposés par l'ANSSI en l'absence de retour d'expérience :
 * 10 % des PP les plus menaçantes en danger, 40 % en contrôle, 40 % en veille, 10 % hors périmètre.
 * Renvoie `null` s'il n'y a aucune PP.
 */
export function seuilsParRepartition(niveaux) {
  const tri = [...niveaux].filter(Number.isFinite).sort((a, b) => b - a);
  if (!tri.length) return null;
  const n = tri.length;
  const at = (fraction) => tri[Math.min(n - 1, Math.max(0, Math.ceil(n * fraction) - 1))];
  return { danger: at(0.1), controle: at(0.5), veille: at(0.9) };
}

// ---------------------------------------------------------------------------
// Atelier 4 – Vraisemblance des scénarios opérationnels
// ---------------------------------------------------------------------------

/** Grille croisée de la fiche méthode 8 : probabilité de succès × difficulté technique → vraisemblance. */
export function vraisemblanceCroisee(probabilite, difficulte) {
  assertLevel(probabilite, 'probabilité');
  assertLevel(difficulte, 'difficulté');
  return MATRICE_VRAISEMBLANCE[probabilite][difficulte];
}

/**
 * Analyse d'un graphe d'attaque.
 *
 * `actions` : [{ id, pr, diff, predecesseurs: [id…], finale?: boolean }]
 * Un nœud sans prédécesseur est un point d'entrée. Les nœuds `finale` (ou, à défaut, les nœuds sans
 * successeur) représentent l'atteinte de l'objectif visé.
 *
 * Indices cumulés intermédiaires (fiche méthode 8) :
 *   Pr(AEn)   = Min { Pr(AEn),   Max(Pr cumulés des antécédents) }
 *   Diff(AEn) = Max { Diff(AEn), Min(Diff cumulées des antécédents) }
 *
 * Autrement dit : dans une séquence, le maillon le moins probable / le plus difficile s'impose ;
 * entre plusieurs chemins alternatifs, l'attaquant retient le plus probable / le plus facile.
 */
export function analyserGraphe(actions) {
  const erreurs = [];
  const byId = new Map();
  for (const a of actions) {
    if (byId.has(a.id)) erreurs.push(`Identifiant d'action dupliqué : ${a.id}`);
    byId.set(a.id, a);
  }

  const preds = new Map();
  const succ = new Map(actions.map((a) => [a.id, []]));
  for (const a of actions) {
    const valid = [];
    for (const p of a.predecesseurs ?? []) {
      if (p === a.id) erreurs.push(`L'action ${a.id} ne peut pas se précéder elle-même`);
      else if (!byId.has(p)) erreurs.push(`L'action ${a.id} référence un antécédent inconnu : ${p}`);
      else if (!valid.includes(p)) {
        valid.push(p);
        succ.get(p).push(a.id);
      }
    }
    preds.set(a.id, valid);
  }

  // Tri topologique (Kahn) pour détecter les cycles et propager les indices dans l'ordre.
  const indeg = new Map(actions.map((a) => [a.id, preds.get(a.id).length]));
  const file = actions.filter((a) => indeg.get(a.id) === 0).map((a) => a.id);
  const ordre = [];
  while (file.length) {
    const id = file.shift();
    ordre.push(id);
    for (const s of succ.get(id)) {
      indeg.set(s, indeg.get(s) - 1);
      if (indeg.get(s) === 0) file.push(s);
    }
  }
  const cycle = ordre.length !== byId.size;
  if (cycle) erreurs.push('Le graphe d’attaque contient un cycle : vérifiez les antécédents.');

  const cumul = {};
  for (const id of ordre) {
    const a = byId.get(id);
    const p = preds.get(id);
    if (!p.length) {
      cumul[id] = { pr: a.pr, diff: a.diff };
    } else {
      const maxPr = Math.max(...p.map((x) => cumul[x].pr));
      const minDiff = Math.min(...p.map((x) => cumul[x].diff));
      cumul[id] = { pr: Math.min(a.pr, maxPr), diff: Math.max(a.diff, minDiff) };
    }
  }

  let finales = actions.filter((a) => a.finale).map((a) => a.id);
  if (!finales.length) finales = actions.filter((a) => succ.get(a.id).length === 0).map((a) => a.id);

  return { ordre, cumul, finales, preds, succ, erreurs, cycle };
}

/**
 * Énumère les modes opératoires (chemins d'un point d'entrée à une action finale).
 * Pour chaque mode : Pr = maillon le moins probable, Diff = maillon le plus difficile.
 */
export function modesOperatoires(actions, graphe = analyserGraphe(actions), { max = MAX_MODES } = {}) {
  if (graphe.cycle) return { modes: [], tronque: false };
  const byId = new Map(actions.map((a) => [a.id, a]));
  const finales = new Set(graphe.finales);
  const modes = [];
  let tronque = false;

  const dfs = (id, chemin) => {
    if (tronque) return;
    const next = [...chemin, id];
    if (finales.has(id)) {
      if (modes.length >= max) { tronque = true; return; }
      const etapes = next.map((x) => byId.get(x));
      modes.push({
        chemin: next,
        pr: Math.min(...etapes.map((e) => e.pr)),
        diff: Math.max(...etapes.map((e) => e.diff)),
        longueur: next.length,
      });
    }
    for (const s of graphe.succ.get(id)) dfs(s, next);
  };
  for (const a of actions) if (!graphe.preds.get(a.id).length) dfs(a.id, []);
  return { modes, tronque };
}

/**
 * Évalue la vraisemblance d'un scénario opérationnel.
 *
 * scenario = {
 *   methode: 'expresse' | 'standard' | 'avancee',
 *   expresse: { mode: 'direct' | 'croise', v, pr, diff },
 *   actions: [...],
 *   correctionChaineLongue: boolean,   // ±1 niveau pour les séquences ≥ SEUIL_CHAINE_LONGUE
 *   sourceDeterminee: boolean,         // +1 niveau si la source de risque est particulièrement déterminée
 * }
 */
export function evaluerScenario(scenario) {
  const methode = scenario.methode ?? 'avancee';
  const avertissements = [];
  const result = { methode, v: null, base: null, graphe: null, modes: [], meilleurMode: null, avertissements };

  if (methode === 'expresse') {
    const e = scenario.expresse ?? {};
    result.base = e.mode === 'croise' ? vraisemblanceCroisee(e.pr, e.diff) : clamp(e.v ?? 0);
  } else {
    const actions = scenario.actions ?? [];
    if (!actions.length) {
      avertissements.push('Aucune action élémentaire : ajoutez au moins une action au graphe d’attaque.');
      return result;
    }
    const graphe = analyserGraphe(actions);
    result.graphe = graphe;
    avertissements.push(...graphe.erreurs);
    if (graphe.cycle) return result;

    const { modes, tronque } = modesOperatoires(actions, graphe);
    const corriger = scenario.correctionChaineLongue !== false;

    if (tronque) {
      // Trop de chemins : on se rabat sur la propagation par nœud (équivalente, sans correction de longueur).
      avertissements.push(`Plus de ${MAX_MODES} modes opératoires : correction des chaînes longues non appliquée.`);
    }

    result.modes = modes.map((m) => {
      const longue = corriger && !tronque && m.longueur >= SEUIL_CHAINE_LONGUE;
      const pr = longue ? clamp(m.pr - 1) : m.pr;
      const diff = longue ? clamp(m.diff + 1) : m.diff;
      const v = methode === 'standard' ? pr : vraisemblanceCroisee(pr, diff);
      return { ...m, prRetenue: pr, diffRetenue: diff, chaineLongue: longue, v };
    });

    if (tronque || !result.modes.length) {
      const prs = graphe.finales.map((id) => graphe.cumul[id].pr);
      const diffs = graphe.finales.map((id) => graphe.cumul[id].diff);
      const pr = Math.max(...prs);
      result.base = methode === 'standard' ? pr : vraisemblanceCroisee(pr, Math.min(...diffs));
      if (methode === 'avancee') {
        avertissements.push('Croisement des indices globaux : la vraisemblance peut être surestimée (fiche méthode 8).');
      }
    } else {
      result.meilleurMode = result.modes.reduce((best, m) =>
        (m.v > best.v || (m.v === best.v && m.longueur < best.longueur) ? m : best));
      result.base = result.meilleurMode.v;
    }
  }

  result.v = scenario.sourceDeterminee ? clamp(result.base + 1) : result.base;
  return result;
}

// ---------------------------------------------------------------------------
// Atelier 5 – Niveau de risque et cartographie
// ---------------------------------------------------------------------------

/**
 * Seuils d'acceptation par défaut (convention de l'outil, à adapter par la gouvernance) :
 * score = gravité + vraisemblance ; ≥ eleve → inacceptable, ≥ moyen → tolérable sous contrôle.
 */
export const SEUILS_RISQUE_DEFAUT = Object.freeze({ moyen: 5, eleve: 7 });

export function niveauRisque(gravite, vraisemblance, seuils = SEUILS_RISQUE_DEFAUT) {
  assertLevel(gravite, 'gravité', 1, 4);
  assertLevel(vraisemblance, 'vraisemblance');
  const score = gravite + vraisemblance;
  if (score >= seuils.eleve) return 'eleve';
  if (score >= seuils.moyen) return 'moyen';
  return 'faible';
}

/**
 * Cartographie : grille[gravité 1..4][vraisemblance 0..4] → liste des identifiants de risques.
 */
export function cartographie(risques) {
  const grille = {};
  for (let g = 1; g <= 4; g++) {
    grille[g] = {};
    for (let v = 0; v <= 4; v++) grille[g][v] = [];
  }
  for (const r of risques) {
    if (Number.isInteger(r.gravite) && Number.isInteger(r.vraisemblance) && grille[r.gravite]?.[r.vraisemblance]) {
      grille[r.gravite][r.vraisemblance].push(r.id);
    }
  }
  return grille;
}
