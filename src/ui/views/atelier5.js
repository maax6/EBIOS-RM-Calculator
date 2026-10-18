import { h } from '../dom.js';
import { update } from '../../store.js';
import { deriverRisques } from '../../core/model.js';
import { cartographie, niveauRisque } from '../../core/ebios.js';
import { GRAVITE, VRAISEMBLANCE, OPTIONS_TRAITEMENT, NIVEAUX_RISQUE, label } from '../../core/scales.js';
import { card, help, badge, select, levelOptions, vClass, gClass, riskClass } from '../components.js';

export function carto(risques, seuils, { residuel = false, titre }) {
  const grille = cartographie(risques.map((r) => ({ id: r.id, gravite: residuel ? r.graviteResiduelle : r.gravite, vraisemblance: residuel ? r.vraisemblanceResiduelle : r.vraisemblance })));
  return h('figure', { class: 'carto' },
    h('figcaption', {}, titre),
    h('table', { class: 'carto-grid' },
      h('tbody', {},
        [4, 3, 2, 1].map((g) => h('tr', {},
          h('th', { scope: 'row', title: label(GRAVITE, g) }, `G${g}`),
          [0, 1, 2, 3, 4].map((v) => h('td', { class: riskClass(niveauRisque(g, v, seuils)), title: `G${g} × V${v} : ${NIVEAUX_RISQUE[niveauRisque(g, v, seuils)].label}` },
            grille[g][v].map((id) => h('span', { class: 'risk-tag' }, id)))))),
        h('tr', {}, h('th', {}), [0, 1, 2, 3, 4].map((v) => h('th', { scope: 'col', title: label(VRAISEMBLANCE, v) }, `V${v}`))))),
    h('div', { class: 'legend' }, Object.entries(NIVEAUX_RISQUE).map(([k, n]) => h('span', {}, h('i', { class: `risk-${k}` }), n.label))));
}

export function viewAtelier5(etude) {
  const risques = deriverRisques(etude);
  const seuils = etude.parametres.seuilsRisque;
  const tr = (soId) => {
    if (!etude.atelier5.traitements[soId]) etude.atelier5.traitements[soId] = { option: 'reduire', mesures: '', responsable: '', echeance: '', graviteResiduelle: null, vraisemblanceResiduelle: null };
    return etude.atelier5.traitements[soId];
  };
  const seuilInput = (key, lbl) => h('label', { class: 'field field-sm' }, h('span', {}, lbl),
    h('input', { class: 'input', type: 'number', min: 1, max: 9, step: 1, value: seuils[key], onchange: (e) => {
      const v = Number(e.target.value);
      if (Number.isInteger(v) && v >= 1 && v <= 9) update((x) => { x.parametres.seuilsRisque[key] = v; });
      else e.target.value = seuils[key];
    } }));

  return [
    card('Cartographie des risques', 'Chaque scénario opérationnel est un risque : gravité (scénario stratégique) × vraisemblance (atelier 4).',
      risques.length ? h('div', { class: 'cartos' },
        carto(risques, seuils, { titre: 'Risques initiaux' }),
        carto(risques, seuils, { titre: 'Risques résiduels', residuel: true })) : help('Aucun risque : créez des scénarios opérationnels à l’atelier 4.'),
      h('div', { class: 'thresholds' }, h('strong', {}, 'Acceptation (score G + V)'), seuilInput('moyen', 'Tolérable ≥'), seuilInput('eleve', 'Inacceptable ≥')),
      help('La grille d’acceptation est une convention de l’outil à faire valider par la gouvernance (l’ANSSI laisse ce choix à l’organisation).')),

    card('Plan de traitement', 'Pour chaque risque : option de traitement, mesures, et niveau résiduel visé après mise en œuvre.',
      risques.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', {}, h('tr', {}, ['Risque', 'Initial', 'Option', 'Mesures de sécurité', 'Responsable / échéance', 'G résid.', 'V résid.', 'Résiduel'].map((t) => h('th', {}, t)))),
        h('tbody', {}, risques.map((r) => {
          const t = etude.atelier5.traitements[r.soId];
          return h('tr', {},
            h('td', {}, h('code', {}, r.id), ' ', h('span', { class: 'small' }, r.titre), r.source ? h('div', { class: 'muted small' }, r.source) : null),
            h('td', {}, badge(r.gravite ? `G${r.gravite}` : 'G?', gClass(r.gravite)), ' ', badge(r.vraisemblance == null ? 'V?' : `V${r.vraisemblance}`, vClass(r.vraisemblance)), h('div', {}, r.niveau ? badge(NIVEAUX_RISQUE[r.niveau].short, riskClass(r.niveau), NIVEAUX_RISQUE[r.niveau].label) : null)),
            h('td', {}, select({ value: t?.option ?? 'reduire', options: OPTIONS_TRAITEMENT, onChange: (v) => update((e) => { tr(r.soId).option = v; }) })),
            h('td', {}, h('textarea', { class: 'input', rows: 2, value: t?.mesures ?? '', placeholder: 'Mesures à mettre en œuvre…', oninput: (e) => update(() => { tr(r.soId).mesures = e.target.value; }, { render: false }) })),
            h('td', {},
              h('input', { class: 'input', value: t?.responsable ?? '', placeholder: 'Responsable', oninput: (e) => update(() => { tr(r.soId).responsable = e.target.value; }, { render: false }) }),
              h('input', { class: 'input', type: 'date', value: t?.echeance ?? '', oninput: (e) => update(() => { tr(r.soId).echeance = e.target.value; }, { render: false }) })),
            h('td', {}, select({ value: r.graviteResiduelle ?? '', options: levelOptions(GRAVITE).map((o) => ({ ...o, label: o.label.split(' –')[0] })), placeholder: '—', onChange: (v) => update(() => { tr(r.soId).graviteResiduelle = v === '' ? null : Number(v); }) })),
            h('td', {}, select({ value: r.vraisemblanceResiduelle ?? '', options: levelOptions(VRAISEMBLANCE).map((o) => ({ ...o, label: o.label.split(' –')[0] })), placeholder: '—', onChange: (v) => update(() => { tr(r.soId).vraisemblanceResiduelle = v === '' ? null : Number(v); }) })),
            h('td', {}, r.niveauResiduel ? badge(NIVEAUX_RISQUE[r.niveauResiduel].short, riskClass(r.niveauResiduel), NIVEAUX_RISQUE[r.niveauResiduel].label) : '—'));
        })))) : null),
  ];
}
