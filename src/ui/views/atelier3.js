import { h } from '../dom.js';
import { update } from '../../store.js';
import { nextId, graviteScenarioStrategique } from '../../core/model.js';
import { niveauMenace, zoneMenace, seuilsParRepartition } from '../../core/ebios.js';
import { CRITERES_PP, GRAVITE, label } from '../../core/scales.js';
import { card, editableTable, help, badge, supprimer, gClass } from '../components.js';

const ZONES = { danger: 'Danger', controle: 'Contrôle', veille: 'Veille', hors: 'Hors périmètre' };
const crit = (key) => CRITERES_PP[key].map((d, i) => ({ value: i + 1, label: `${i + 1}`, title: d }));
const menace = (pp) => niveauMenace(pp, { sansConfiance: pp.sansConfiance });

function radar(pps, seuils) {
  const size = 340, c = size / 2, R = 150;
  const niveaux = pps.map(menace);
  const maxN = Math.max(seuils.danger * 1.5, ...niveaux, 1);
  const r = (n) => R * (1 - Math.min(n, maxN) / maxN);
  const cats = [...new Set(pps.map((p) => p.categorie || 'Autre'))];
  const ring = (n, cls, lbl) => [
    h('circle', { cx: c, cy: c, r: Math.max(r(n), 2), class: `ring ${cls}` }),
    h('text', { x: c + 4, y: c - Math.max(r(n), 2) + 12, class: 'ring-label' }, lbl),
  ];
  return h('svg', { viewBox: `0 0 ${size} ${size}`, class: 'radar', role: 'img', 'aria-label': 'Cartographie radar de la menace des parties prenantes' },
    h('circle', { cx: c, cy: c, r: R, class: 'ring ring-hors' }),
    ring(seuils.veille, 'ring-veille', 'Veille'),
    ring(seuils.controle, 'ring-controle', 'Contrôle'),
    ring(seuils.danger, 'ring-danger', 'Danger'),
    cats.map((cat, i) => {
      const a = (2 * Math.PI * i) / cats.length - Math.PI / 2;
      return [h('line', { x1: c, y1: c, x2: c + R * Math.cos(a), y2: c + R * Math.sin(a), class: 'axis' }),
        h('text', { x: c + (R + 4) * Math.cos(a + Math.PI / cats.length), y: c + (R + 4) * Math.sin(a + Math.PI / cats.length), class: 'axis-label', 'text-anchor': 'middle' }, cat)];
    }),
    pps.map((pp, i) => {
      const catIdx = cats.indexOf(pp.categorie || 'Autre');
      const sameCat = pps.filter((p) => (p.categorie || 'Autre') === (pp.categorie || 'Autre'));
      const k = sameCat.indexOf(pp);
      const span = (2 * Math.PI) / cats.length;
      const a = -Math.PI / 2 + span * catIdx + (span * (k + 1)) / (sameCat.length + 1);
      const n = niveaux[i];
      const rr = Math.max(r(n), 8);
      const zone = zoneMenace(n, seuils);
      return h('g', { class: `pp-dot zone-${zone}` },
        h('circle', { cx: c + rr * Math.cos(a), cy: c + rr * Math.sin(a), r: 9 }),
        h('text', { x: c + rr * Math.cos(a), y: c + rr * Math.sin(a) + 3.5, 'text-anchor': 'middle' }, pp.id.replace('PP', '')),
        h('title', {}, `${pp.id} ${pp.nom} – menace ${n} (${ZONES[zone]})`));
    }));
}

export function viewAtelier3(etude) {
  const a3 = etude.atelier3;
  const seuils = etude.parametres.seuilsMenace;
  const seuilInput = (key, lbl) => h('label', { class: 'field field-sm' }, h('span', {}, lbl),
    h('input', { class: 'input', type: 'number', min: 0, step: 0.1, value: seuils[key], onchange: (e) => {
      const v = Number(e.target.value);
      if (Number.isFinite(v) && v >= 0) update((x) => { x.parametres.seuilsMenace[key] = v; });
      else e.target.value = seuils[key];
    } }));
  const seuilsIncoherents = !(seuils.danger >= seuils.controle && seuils.controle >= seuils.veille);
  const couplesRetenus = etude.atelier2.couples.filter((c) => c.retenu).map((c) => ({ value: c.id, label: `${c.id} · ${c.source || '?'} → ${c.objectif || '?'}` }));
  const erOptions = etude.atelier1.evenementsRedoutes.map((er) => ({ value: er.id, label: `${er.id} (G${er.gravite})`, title: er.description }));
  const ppOptions = a3.partiesPrenantes.map((pp) => ({ value: pp.id, label: `${pp.id} ${pp.nom}`.trim(), title: ZONES[zoneMenace(menace(pp), seuils)] }));

  return [
    card('Cartographie de la menace de l’écosystème', 'Niveau de menace = (Dépendance × Pénétration) / (Maturité cyber × Confiance). Chaque critère est coté de 1 à 4 (survolez les valeurs pour la définition).',
      h('div', { class: 'split' },
        h('div', { class: 'split-main' },
          editableTable({
            items: a3.partiesPrenantes,
            columns: [
              { key: 'nom', label: 'Partie prenante', placeholder: 'ex. Infogéreur', minWidth: '180px' },
              { key: 'categorie', label: 'Catégorie', type: 'select', options: ['Client', 'Partenaire', 'Prestataire', 'Fournisseur', 'Interne', 'Filiale'].map((v) => ({ value: v, label: v })), placeholder: '—', width: '130px' },
              { key: 'dependance', label: 'Dép.', title: 'Dépendance', type: 'level', options: crit('dependance'), width: '64px' },
              { key: 'penetration', label: 'Pén.', title: 'Pénétration', type: 'level', options: crit('penetration'), width: '64px' },
              { key: 'maturite', label: 'Mat.', title: 'Maturité cyber', type: 'level', options: crit('maturite'), width: '64px' },
              { key: 'confiance', label: 'Conf.', title: 'Confiance', type: 'level', options: crit('confiance'), width: '64px' },
              { key: 'sansConfiance', label: 'Sans conf.', title: 'PP utilisée à ses dépens : le critère de confiance est retiré de la formule', type: 'checkbox', width: '60px' },
              { key: '_m', label: 'Menace', type: 'computed', width: '120px', render: (pp) => { const n = menace(pp); const z = zoneMenace(n, seuils); return badge(`${n.toLocaleString('fr-FR')} · ${ZONES[z]}`, `zone-${z}`); } },
            ],
            onAdd: () => update((e) => e.atelier3.partiesPrenantes.push({ id: nextId(e.atelier3.partiesPrenantes, 'PP'), nom: '', categorie: 'Prestataire', dependance: 2, penetration: 2, maturite: 2, confiance: 2, sansConfiance: false })),
            addLabel: 'Partie prenante',
            onRemove: (it) => supprimer((e) => { e.atelier3.partiesPrenantes = e.atelier3.partiesPrenantes.filter((x) => x.id !== it.id); }, it.id),
          }),
          h('div', { class: 'thresholds' },
            h('strong', {}, 'Seuils'), seuilInput('danger', 'Danger ≥'), seuilInput('controle', 'Contrôle ≥'), seuilInput('veille', 'Veille ≥'),
            h('button', { type: 'button', class: 'btn btn-secondary', disabled: a3.partiesPrenantes.length < 2, title: 'Répartition proposée par l’ANSSI en l’absence de retour d’expérience', onclick: () => {
              const s = seuilsParRepartition(a3.partiesPrenantes.map(menace));
              if (s) update((x) => { x.parametres.seuilsMenace = s; });
            } }, 'Répartition 10/40/40/10')),
          seuilsIncoherents ? h('p', { class: 'warn' }, 'Les seuils doivent respecter danger ≥ contrôle ≥ veille.') : null,
          help('Les PP en zone de danger ou de contrôle sont dites critiques : intégrez-les aux scénarios stratégiques. Aucune PP ne devrait rester en zone de danger.')),
        h('div', { class: 'split-side' }, radar(a3.partiesPrenantes, seuils)))),

    card('Scénarios stratégiques', 'Chemins d’attaque d’une source de risque vers son objectif, éventuellement via l’écosystème. Gravité = gravité maximale des événements redoutés visés.',
      editableTable({
        items: a3.scenariosStrategiques,
        columns: [
          { key: 'coupleId', label: 'Couple SR/OV', type: 'select', options: couplesRetenus, placeholder: '— couple retenu —', width: '220px' },
          { key: 'description', label: 'Chemin d’attaque', type: 'textarea', placeholder: 'ex. Un concurrent compromet le prestataire pour voler les travaux de R&D', minWidth: '240px' },
          { key: 'evenementIds', label: 'Événements redoutés', type: 'chips', options: erOptions, empty: 'Définissez des ER à l’atelier 1', minWidth: '160px' },
          { key: 'ppIds', label: 'Parties prenantes', type: 'chips', options: ppOptions, empty: '—', minWidth: '200px' },
          { key: '_g', label: 'Gravité', type: 'computed', width: '80px', render: (ss) => { const g = graviteScenarioStrategique(etude, ss); return badge(g ? `G${g}` : '—', gClass(g), g ? label(GRAVITE, g) : 'Aucun événement redouté'); } },
        ],
        onAdd: () => update((e) => e.atelier3.scenariosStrategiques.push({ id: nextId(e.atelier3.scenariosStrategiques, 'SS'), coupleId: couplesRetenus[0]?.value ?? '', description: '', evenementIds: [], ppIds: [] })),
        addLabel: 'Scénario stratégique',
        onRemove: (it) => supprimer((e) => { e.atelier3.scenariosStrategiques = e.atelier3.scenariosStrategiques.filter((x) => x.id !== it.id); }, it.id),
      })),
  ];
}
