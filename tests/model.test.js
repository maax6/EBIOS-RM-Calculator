import { describe, it, expect } from 'vitest';
import { normaliserEtude, deriverRisques, etudeVide, nextId, controlesCoherence } from '../src/core/model.js';
import { etudeExemple } from '../src/core/exemple.js';
import { risquesToCSV, csvCell } from '../src/core/export.js';

describe('Normalisation / import', () => {
  it('l’étude d’exemple est valide et stable', () => {
    const { etude, erreurs } = normaliserEtude(etudeExemple());
    expect(erreurs).toEqual([]);
    expect(etude).toEqual(etudeExemple());
  });
  it('corrige les valeurs hors échelle et retire les références cassées', () => {
    const raw = etudeVide();
    raw.atelier1.evenementsRedoutes = [{ id: 'ER1', gravite: 9, valeurMetierId: 'VM404' }];
    raw.atelier4.scenariosOperationnels = [{ id: 'SO1', actions: [{ id: 'AE1', pr: 7, diff: -1, predecesseurs: ['AE9'] }] }];
    const { etude, erreurs } = normaliserEtude(raw);
    expect(etude.atelier1.evenementsRedoutes[0]).toMatchObject({ gravite: 2, valeurMetierId: '' });
    expect(etude.atelier4.scenariosOperationnels[0].actions[0]).toMatchObject({ pr: 2, diff: 2, predecesseurs: [] });
    expect(erreurs.length).toBeGreaterThanOrEqual(3);
  });
  it('rejette les documents inexploitables', () => {
    expect(() => normaliserEtude(null)).toThrow();
    expect(() => normaliserEtude([1, 2])).toThrow();
    expect(() => normaliserEtude({ version: 99 })).toThrow();
  });
  it('ignore les identifiants dangereux (injection HTML)', () => {
    const raw = etudeVide();
    raw.atelier1.valeursMetier = [{ id: '<img src=x onerror=alert(1)>', nom: 'x' }, { id: 'VM1', nom: '<b>ok</b>' }];
    const { etude } = normaliserEtude(raw);
    expect(etude.atelier1.valeursMetier.map((v) => v.id)).toEqual(['VM1']);
  });
  it('migre l’ancien format v2 (4 étapes + socle)', () => {
    const v2 = { currentStep: 0, steps: [
      { name: 'Connaître', prob: 4, diff: 1, socle: 0 }, { name: 'Rentrer', prob: 4, diff: 4, socle: 3 },
      { name: 'Trouver', prob: 4, diff: 2, socle: 0 }, { name: 'Exploiter', prob: 4, diff: 0, socle: 0 }] };
    const { etude, erreurs } = normaliserEtude(v2);
    const so = etude.atelier4.scenariosOperationnels[0];
    expect(so.actions).toHaveLength(4);
    expect(so.actions[3].predecesseurs).toEqual(['AE3']);
    expect(erreurs.join(' ')).toMatch(/socle/);
    expect(deriverRisques(etude)[0].vraisemblance).toBe(1); // Pr4 × D4 (maillon le plus difficile) → V1
  });
});

describe('Dérivation des risques', () => {
  it('gravité = max des ER du scénario stratégique ; vraisemblance = atelier 4', () => {
    const risques = deriverRisques(etudeExemple());
    expect(risques).toHaveLength(2);
    expect(risques[0]).toMatchObject({ id: 'R1', gravite: 3, vraisemblance: 3, niveau: 'moyen', niveauResiduel: 'faible' });
    expect(risques[1]).toMatchObject({ id: 'R2', gravite: 4, vraisemblance: 3, niveau: 'eleve', niveauResiduel: 'moyen' });
  });
  it('signale les incohérences', () => {
    const e = etudeVide();
    e.atelier4.scenariosOperationnels = [{ id: 'SO1', ssId: '', methode: 'avancee', actions: [] }];
    const msgs = controlesCoherence(e).map((w) => w.msg).join(' ');
    expect(msgs).toMatch(/valeur métier/);
    expect(msgs).toMatch(/SO1/);
  });
  it('nextId', () => {
    expect(nextId([{ id: 'VM1' }, { id: 'VM7' }, { id: 'X9' }], 'VM')).toBe('VM8');
    expect(nextId([], 'AE')).toBe('AE1');
  });
});

describe('Export CSV', () => {
  it('produit un CSV « ; » avec BOM et neutralise les formules', () => {
    const csv = risquesToCSV(deriverRisques(etudeExemple()));
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv.split('\r\n')).toHaveLength(3);
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('a;b')).toBe('"a;b"');
  });
});
