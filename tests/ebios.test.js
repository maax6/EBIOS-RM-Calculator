import { describe, it, expect } from 'vitest';
import {
  vraisemblanceCroisee, analyserGraphe, modesOperatoires, evaluerScenario, niveauMenace, zoneMenace,
  seuilsParRepartition, pertinenceSROV, niveauRisque, cartographie, SEUIL_CHAINE_LONGUE,
} from '../src/core/ebios.js';
import { MATRICE_VRAISEMBLANCE } from '../src/core/scales.js';
import { etudeExemple } from '../src/core/exemple.js';

const chaine = (cotes) => cotes.map(([pr, diff], i) => ({
  id: `AE${i + 1}`, pr, diff, predecesseurs: i ? [`AE${i}`] : [], finale: i === cotes.length - 1,
}));

describe('Grille croisée (fiche méthode 8 ANSSI)', () => {
  it('reproduit la matrice officielle, V0 compris', () => {
    expect(MATRICE_VRAISEMBLANCE).toEqual([
      [1, 1, 1, 0, 0], [2, 2, 2, 1, 0], [3, 3, 2, 2, 1], [4, 3, 3, 2, 1], [4, 4, 3, 2, 1],
    ]);
    expect(vraisemblanceCroisee(4, 0)).toBe(4);
    expect(vraisemblanceCroisee(0, 4)).toBe(0);
    expect(vraisemblanceCroisee(1, 4)).toBe(0);
    expect(vraisemblanceCroisee(2, 2)).toBe(2);
  });
  it('refuse les valeurs hors échelle', () => {
    expect(() => vraisemblanceCroisee(5, 0)).toThrow(RangeError);
    expect(() => vraisemblanceCroisee(1.5, 0)).toThrow(RangeError);
  });
});

describe('Indices cumulés intermédiaires', () => {
  it('séquence : la difficulté cumulée est celle du maillon le plus difficile', () => {
    // Exemple de l'ancien outil [1, 4, 2, 0] : l'ancienne implémentation renvoyait 1, la règle ANSSI donne 4.
    const g = analyserGraphe(chaine([[4, 1], [4, 4], [4, 2], [4, 0]]));
    expect(g.cumul.AE4.diff).toBe(4);
  });
  it('séquence : la probabilité cumulée est celle du maillon le moins probable', () => {
    const g = analyserGraphe(chaine([[4, 0], [1, 0], [3, 0]]));
    expect(g.cumul.AE3.pr).toBe(1);
  });
  it('chemins alternatifs : l’attaquant prend le plus probable et le plus facile', () => {
    const actions = [
      { id: 'A', pr: 4, diff: 0, predecesseurs: [] },
      { id: 'B1', pr: 1, diff: 1, predecesseurs: ['A'] },
      { id: 'B2', pr: 3, diff: 3, predecesseurs: ['A'] },
      { id: 'C', pr: 4, diff: 0, predecesseurs: ['B1', 'B2'], finale: true },
    ];
    const g = analyserGraphe(actions);
    expect(g.cumul.C).toEqual({ pr: 3, diff: 1 });
  });
  it('détecte cycles, antécédents inconnus et auto-références', () => {
    const g = analyserGraphe([
      { id: 'A', pr: 2, diff: 2, predecesseurs: ['B'] },
      { id: 'B', pr: 2, diff: 2, predecesseurs: ['A', 'X', 'B'] },
    ]);
    expect(g.cycle).toBe(true);
    expect(g.erreurs.join(' ')).toMatch(/inconnu/);
    expect(g.erreurs.join(' ')).toMatch(/elle-même/);
  });
});

describe('Vraisemblance d’un scénario opérationnel', () => {
  it('méthode standard : reproduit l’exemple ANSSI (indice global = 3 → V3)', () => {
    const so = etudeExemple().atelier4.scenariosOperationnels[0];
    const g = analyserGraphe(so.actions);
    expect(g.cumul.AE7.pr).toBe(3);
    expect(g.cumul.AE6.pr).toBe(2);
    expect(g.cumul.AE10.pr).toBe(3);
    expect(evaluerScenario({ ...so, methode: 'standard' }).v).toBe(3);
  });
  it('méthode avancée : vraisemblance du mode opératoire le plus vraisemblable, sans croiser des modes différents', () => {
    // Mode 1 : très probable mais très difficile ; mode 2 : facile mais peu probable.
    const actions = [
      { id: 'A1', pr: 4, diff: 4, predecesseurs: [] },
      { id: 'A2', pr: 1, diff: 0, predecesseurs: [] },
      { id: 'F', pr: 4, diff: 0, predecesseurs: ['A1', 'A2'], finale: true },
    ];
    const r = evaluerScenario({ methode: 'avancee', actions });
    expect(r.modes.map((m) => m.v).sort()).toEqual([1, 2]);
    expect(r.v).toBe(2); // croiser Pr global (4) et Diff globale (0) aurait donné V4 : surestimation
  });
  it('correction des chaînes longues (≥ ~10 actions)', () => {
    const longue = chaine(Array.from({ length: SEUIL_CHAINE_LONGUE }, () => [3, 1]));
    expect(evaluerScenario({ methode: 'standard', actions: longue }).v).toBe(2);
    expect(evaluerScenario({ methode: 'standard', actions: longue, correctionChaineLongue: false }).v).toBe(3);
    // Avancée : Pr3→Pr2 et D1→D2, donc V2 au lieu de V3 sans correction.
    expect(evaluerScenario({ methode: 'avancee', actions: longue }).v).toBe(2);
    expect(evaluerScenario({ methode: 'avancee', actions: longue, correctionChaineLongue: false }).v).toBe(3);
  });
  it('majoration d’un niveau si la source de risque est particulièrement déterminée (plafonnée à V4)', () => {
    const actions = chaine([[2, 2]]);
    expect(evaluerScenario({ methode: 'avancee', actions }).v).toBe(2);
    expect(evaluerScenario({ methode: 'avancee', actions, sourceDeterminee: true }).v).toBe(3);
    expect(evaluerScenario({ methode: 'expresse', expresse: { mode: 'direct', v: 4 }, sourceDeterminee: true }).v).toBe(4);
  });
  it('méthode expresse : cotation directe ou croisée', () => {
    expect(evaluerScenario({ methode: 'expresse', expresse: { mode: 'direct', v: 1 } }).v).toBe(1);
    expect(evaluerScenario({ methode: 'expresse', expresse: { mode: 'croise', pr: 3, diff: 1 } }).v).toBe(3);
  });
  it('graphe vide ou cyclique : pas de vraisemblance, avertissement', () => {
    expect(evaluerScenario({ methode: 'avancee', actions: [] }).v).toBeNull();
    const cyc = evaluerScenario({ methode: 'avancee', actions: [{ id: 'A', pr: 1, diff: 1, predecesseurs: ['B'] }, { id: 'B', pr: 1, diff: 1, predecesseurs: ['A'] }] });
    expect(cyc.v).toBeNull();
    expect(cyc.avertissements.length).toBeGreaterThan(0);
  });
  it('énumère les modes opératoires de l’exemple ANSSI', () => {
    const so = etudeExemple().atelier4.scenariosOperationnels[0];
    const { modes } = modesOperatoires(so.actions);
    expect(modes.length).toBe(5);
    expect(Math.max(...modes.map((m) => m.pr))).toBe(3);
  });
});

describe('Atelier 3 – menace des parties prenantes', () => {
  it('(dépendance × pénétration) / (maturité × confiance)', () => {
    expect(niveauMenace({ dependance: 4, penetration: 4, maturite: 2, confiance: 2 })).toBe(4);
    expect(niveauMenace({ dependance: 3, penetration: 3, maturite: 2, confiance: 3 })).toBe(1.5);
    expect(niveauMenace({ dependance: 1, penetration: 2, maturite: 3, confiance: 3 })).toBe(0.22);
  });
  it('permet de retirer le critère de confiance', () => {
    expect(niveauMenace({ dependance: 2, penetration: 2, maturite: 1, confiance: 4 }, { sansConfiance: true })).toBe(4);
  });
  it('zones et répartition 10/40/40/10', () => {
    const s = { danger: 3, controle: 1.5, veille: 0.5 };
    expect(zoneMenace(4, s)).toBe('danger');
    expect(zoneMenace(1.5, s)).toBe('controle');
    expect(zoneMenace(0.6, s)).toBe('veille');
    expect(zoneMenace(0.2, s)).toBe('hors');
    const niveaux = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    expect(seuilsParRepartition(niveaux)).toEqual({ danger: 10, controle: 6, veille: 2 });
    expect(seuilsParRepartition([])).toBeNull();
  });
  it('refuse une cotation hors 1–4', () => {
    expect(() => niveauMenace({ dependance: 0, penetration: 1, maturite: 1, confiance: 1 })).toThrow();
  });
});

describe('Ateliers 2 et 5', () => {
  it('pertinence SR/OV (motivation × ressources)', () => {
    expect(pertinenceSROV(1, 1)).toBe(1);
    expect(pertinenceSROV(2, 2)).toBe(2);
    expect(pertinenceSROV(3, 2)).toBe(3);
    expect(pertinenceSROV(1, 3)).toBe(2);
  });
  it('niveau de risque et cartographie', () => {
    expect(niveauRisque(4, 3)).toBe('eleve');
    expect(niveauRisque(3, 3)).toBe('moyen');
    expect(niveauRisque(2, 1)).toBe('faible');
    const g = cartographie([{ id: 'R1', gravite: 4, vraisemblance: 3 }, { id: 'R2', gravite: 4, vraisemblance: 3 }, { id: 'R3', gravite: null, vraisemblance: 2 }]);
    expect(g[4][3]).toEqual(['R1', 'R2']);
  });
});
