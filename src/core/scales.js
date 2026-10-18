/**
 * Échelles EBIOS Risk Manager.
 *
 * Sources :
 *  - ANSSI, Guide EBIOS Risk Manager (2018) et « Le supplément » (fiches méthodes).
 *  - ANSSI, Fiche méthode 8 – Atelier 4 « Évaluer la vraisemblance des scénarios opérationnels ».
 *
 * Toutes les échelles sont des exemples génériques proposés par l'ANSSI : elles peuvent être
 * adaptées à l'étude, mais le calcul de vraisemblance suppose que probabilité, difficulté et
 * vraisemblance aient le même nombre de niveaux (ici 5 : 0 à 4).
 */

export const GRAVITE = [
  { value: 1, code: 'G1', label: 'Mineure', desc: "Conséquences négligeables pour l'organisation." },
  { value: 2, code: 'G2', label: 'Significative', desc: "Conséquences significatives mais limitées (fonctionnement en mode dégradé)." },
  { value: 3, code: 'G3', label: 'Grave', desc: "Conséquences importantes (fonctionnement en mode très dégradé)." },
  { value: 4, code: 'G4', label: 'Critique', desc: "Conséquences désastreuses, la survie de l'organisation est menacée." },
];

export const VRAISEMBLANCE = [
  { value: 0, code: 'V0', label: 'Invraisemblable', desc: "La source de risque a très peu de chances d'atteindre son objectif." },
  { value: 1, code: 'V1', label: 'Peu vraisemblable', desc: "La source de risque a relativement peu de chances d'atteindre son objectif." },
  { value: 2, code: 'V2', label: 'Vraisemblable', desc: "La source de risque est susceptible d'atteindre son objectif." },
  { value: 3, code: 'V3', label: 'Très vraisemblable', desc: "La source de risque va probablement atteindre son objectif." },
  { value: 4, code: 'V4', label: 'Quasi certain', desc: "La source de risque va très certainement atteindre son objectif." },
];

export const PROBABILITE = [
  { value: 0, code: 'Pr0', label: 'Très faible', desc: 'Probabilité de succès < 3 %' },
  { value: 1, code: 'Pr1', label: 'Faible', desc: 'Probabilité de succès < 20 %' },
  { value: 2, code: 'Pr2', label: 'Significative', desc: 'Probabilité de succès > 20 %' },
  { value: 3, code: 'Pr3', label: 'Très élevée', desc: 'Probabilité de succès > 60 %' },
  { value: 4, code: 'Pr4', label: 'Quasi certaine', desc: 'Probabilité de succès > 90 %' },
];

export const DIFFICULTE = [
  { value: 0, code: 'D0', label: 'Négligeable', desc: 'Ressources négligeables ou déjà disponibles.' },
  { value: 1, code: 'D1', label: 'Faible', desc: 'Ressources engagées faibles.' },
  { value: 2, code: 'D2', label: 'Modérée', desc: 'Ressources significatives.' },
  { value: 3, code: 'D3', label: 'Élevée', desc: 'Ressources importantes.' },
  { value: 4, code: 'D4', label: 'Très élevée', desc: 'Ressources très importantes.' },
];

/**
 * Grille croisée « probabilité de succès × difficulté technique » → vraisemblance.
 * Reproduite à l'identique de la fiche méthode 8 (atelier 4) de l'ANSSI.
 * Indexation : MATRICE_VRAISEMBLANCE[probabilité][difficulté].
 */
export const MATRICE_VRAISEMBLANCE = Object.freeze([
  Object.freeze([1, 1, 1, 0, 0]), // Pr0 – très faible
  Object.freeze([2, 2, 2, 1, 0]), // Pr1 – faible
  Object.freeze([3, 3, 2, 2, 1]), // Pr2 – significative
  Object.freeze([4, 3, 3, 2, 1]), // Pr3 – très élevée
  Object.freeze([4, 4, 3, 2, 1]), // Pr4 – quasi certaine
]);

/** Atelier 2 : métrique motivation × ressources → pertinence d'un couple SR/OV (fiche méthode 4). */
export const NIVEAU_3 = [
  { value: 1, code: '+', label: 'Faible' },
  { value: 2, code: '++', label: 'Moyen' },
  { value: 3, code: '+++', label: 'Fort' },
];
export const PERTINENCE = [
  { value: 1, label: 'Faible' },
  { value: 2, label: 'Moyenne' },
  { value: 3, label: 'Élevée' },
];
// MATRICE_PERTINENCE[motivation-1][ressources-1]
export const MATRICE_PERTINENCE = Object.freeze([
  Object.freeze([1, 1, 2]), // motivation +
  Object.freeze([1, 2, 3]), // motivation ++
  Object.freeze([2, 3, 3]), // motivation +++
]);

/** Atelier 3 : critères d'évaluation des parties prenantes (1 à 4). */
export const CRITERES_PP = {
  dependance: ['Non nécessaire aux fonctions stratégiques', 'Utile aux fonctions stratégiques', 'Indispensable mais non exclusive', 'Indispensable et unique'],
  penetration: ["Pas d'accès ou accès utilisateur à des terminaux", 'Accès admin à des terminaux ou accès physique aux sites', 'Accès admin à des serveurs métier', "Accès admin à l'infrastructure ou aux salles serveurs"],
  maturite: ["Hygiène ponctuelle, non formalisée", 'Hygiène prise en compte, mode réactif', 'Politique globale, début d’anticipation', 'Management du risque intégré et proactif'],
  confiance: ['Intentions non évaluables', 'Intentions neutres', 'Intentions connues, probablement positives', 'Intentions connues et pleinement compatibles'],
};

/** Étapes types d'un scénario opérationnel (modèle « Connaître / Rentrer / Trouver / Exploiter »). */
export const PHASES = [
  { value: 'connaitre', label: 'Connaître' },
  { value: 'rentrer', label: 'Rentrer' },
  { value: 'trouver', label: 'Trouver' },
  { value: 'exploiter', label: 'Exploiter' },
];

export const STATUT_SOCLE = [
  { value: 'applique', label: 'Appliqué sans restriction' },
  { value: 'restrictions', label: 'Appliqué avec restrictions' },
  { value: 'non_applique', label: 'Non appliqué' },
];

export const OPTIONS_TRAITEMENT = [
  { value: 'reduire', label: 'Réduire' },
  { value: 'accepter', label: 'Accepter' },
  { value: 'transferer', label: 'Transférer / partager' },
  { value: 'refuser', label: 'Refuser / éviter' },
];

export const NIVEAUX_RISQUE = {
  faible: { label: 'Acceptable en l’état', short: 'Faible' },
  moyen: { label: 'Tolérable sous contrôle', short: 'Moyen' },
  eleve: { label: 'Inacceptable', short: 'Élevé' },
};

export const label = (scale, value) => scale.find((s) => s.value === value)?.label ?? '—';
export const code = (scale, value) => scale.find((s) => s.value === value)?.code ?? '—';
