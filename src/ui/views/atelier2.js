import { h } from '../dom.js';
import { update } from '../../store.js';
import { nextId } from '../../core/model.js';
import { pertinenceSROV } from '../../core/ebios.js';
import { NIVEAU_3, PERTINENCE, label } from '../../core/scales.js';
import { card, editableTable, help, badge, supprimer } from '../components.js';

const niveau3 = NIVEAU_3.map((n) => ({ value: n.value, label: `${n.code} ${n.label}` }));
const SOURCES = ['Étatique', 'Crime organisé', 'Terroriste', 'Activiste idéologique', 'Officine spécialisée', 'Amateur', 'Vengeur', 'Malveillant pathologique', 'Concurrent', 'Personnel interne'];

export function viewAtelier2(etude) {
  const couples = etude.atelier2.couples;
  return [
    card('Sources de risque et objectifs visés', 'Qui pourrait attaquer, et pour quoi faire ? Évaluez chaque couple SR/OV puis retenez les plus pertinents.',
      help('Pertinence indicative selon la métrique de l’ANSSI (motivation × ressources). La décision de retenir un couple reste celle du groupe de travail : privilégiez des couples pertinents et variés.'),
      h('datalist', { id: 'sources-types' }, SOURCES.map((s) => h('option', { value: s }))),
      editableTable({
        items: couples,
        columns: [
          { key: 'source', label: 'Source de risque', placeholder: 'ex. Cybercriminel' },
          { key: 'objectif', label: 'Objectif visé', placeholder: 'ex. Rançonner l’organisation' },
          { key: 'motivation', label: 'Motivation', type: 'level', options: niveau3, width: '130px' },
          { key: 'ressources', label: 'Ressources', type: 'level', options: niveau3, width: '130px' },
          { key: '_p', label: 'Pertinence', type: 'computed', width: '110px', render: (c) => { const p = pertinenceSROV(c.motivation, c.ressources); return badge(label(PERTINENCE, p), `pert-${p}`); } },
          { key: 'retenu', label: 'Retenu', type: 'checkbox', width: '70px' },
        ],
        onAdd: () => update((e) => e.atelier2.couples.push({ id: nextId(e.atelier2.couples, 'SROV'), source: '', objectif: '', motivation: 2, ressources: 2, retenu: true })),
        addLabel: 'Couple SR/OV',
        onRemove: (it) => supprimer((e) => { e.atelier2.couples = e.atelier2.couples.filter((x) => x.id !== it.id); }, it.id),
      })),
  ].map((el) => { el.querySelectorAll('input[aria-label="Source de risque"]').forEach((i) => i.setAttribute('list', 'sources-types')); return el; });
}
