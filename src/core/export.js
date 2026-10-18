/** Exports texte (JSON, CSV) – sans dépendance au DOM, testables. */
import { label, GRAVITE, VRAISEMBLANCE, NIVEAUX_RISQUE, OPTIONS_TRAITEMENT } from './scales.js';

export const toJSON = (etude) => JSON.stringify(etude, null, 2);

/** Échappe une cellule CSV (séparateur « ; » pour Excel FR) et neutralise l'injection de formules. */
export function csvCell(value) {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function risquesToCSV(risques) {
  const header = ['Risque', 'Scénario opérationnel', 'Intitulé', 'Source → objectif', 'Gravité', 'Vraisemblance', 'Niveau initial',
    'Option de traitement', 'Mesures', 'Gravité résiduelle', 'Vraisemblance résiduelle', 'Niveau résiduel'];
  const lvl = (g, scale) => (g == null ? '' : `${scale.find((s) => s.value === g)?.code} – ${label(scale, g)}`);
  const rows = risques.map((r) => [
    r.id, r.soId, r.titre, r.source,
    lvl(r.gravite, GRAVITE), lvl(r.vraisemblance, VRAISEMBLANCE), r.niveau ? NIVEAUX_RISQUE[r.niveau].label : '',
    r.traitement ? label(OPTIONS_TRAITEMENT, r.traitement.option) : '', r.traitement?.mesures ?? '',
    lvl(r.graviteResiduelle, GRAVITE), lvl(r.vraisemblanceResiduelle, VRAISEMBLANCE), r.niveauResiduel ? NIVEAUX_RISQUE[r.niveauResiduel].label : '',
  ]);
  // BOM UTF-8 pour un affichage correct des accents dans Excel.
  return '\uFEFF' + [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
}
