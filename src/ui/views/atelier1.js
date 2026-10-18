import { h } from '../dom.js';
import { update } from '../../store.js';
import { nextId } from '../../core/model.js';
import { GRAVITE, STATUT_SOCLE, label } from '../../core/scales.js';
import { card, editableTable, help, levelOptions, supprimer, badge, gClass } from '../components.js';

export function viewAtelier1(etude) {
  const a1 = etude.atelier1;
  const m = etude.meta;
  const metaField = (key, lbl, type = 'text') => h('label', { class: 'field' }, h('span', {}, lbl),
    h('input', { class: 'input', type, value: m[key], oninput: (e) => update((x) => { x.meta[key] = e.target.value; }, { render: key === 'titre' }) }));
  const vmOptions = a1.valeursMetier.map((v) => ({ value: v.id, label: `${v.id} ${v.nom}`.trim(), title: v.description }));

  return [
    card('Étude', 'Informations générales, reprises dans le rapport.',
      h('div', { class: 'grid-form' },
        metaField('titre', 'Titre de l’étude'), metaField('organisation', 'Organisation'),
        metaField('perimetre', 'Périmètre'), metaField('auteur', 'Auteur / animateur'), metaField('date', 'Date', 'date'))),

    card('Valeurs métier', 'Ce que l’organisation doit protéger : processus, informations, savoir-faire.',
      editableTable({
        items: a1.valeursMetier,
        columns: [
          { key: 'nom', label: 'Valeur métier', placeholder: 'ex. Fabriquer des vaccins' },
          { key: 'nature', label: 'Nature', type: 'select', options: ['Processus', 'Information', 'Savoir-faire'].map((v) => ({ value: v, label: v })), placeholder: '—', width: '160px' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ],
        onAdd: () => update((e) => e.atelier1.valeursMetier.push({ id: nextId(e.atelier1.valeursMetier, 'VM'), nom: '', nature: 'Processus', description: '' })),
        addLabel: 'Valeur métier',
        onRemove: (it) => supprimer((e) => { e.atelier1.valeursMetier = e.atelier1.valeursMetier.filter((x) => x.id !== it.id); }, it.id),
      })),

    card('Biens supports', 'Composantes du SI sur lesquelles reposent les valeurs métier.',
      editableTable({
        items: a1.biensSupports,
        columns: [
          { key: 'nom', label: 'Bien support', placeholder: 'ex. Serveurs R&D' },
          { key: 'valeurMetierIds', label: 'Valeurs métier', type: 'chips', options: vmOptions, empty: 'Ajoutez d’abord des valeurs métier', minWidth: '240px' },
          { key: 'responsable', label: 'Responsable', width: '160px' },
        ],
        onAdd: () => update((e) => e.atelier1.biensSupports.push({ id: nextId(e.atelier1.biensSupports, 'BS'), nom: '', valeurMetierIds: [], responsable: '' })),
        addLabel: 'Bien support',
        onRemove: (it) => supprimer((e) => { e.atelier1.biensSupports = e.atelier1.biensSupports.filter((x) => x.id !== it.id); }, it.id),
      })),

    card('Événements redoutés', 'Atteinte à une valeur métier et gravité de ses impacts (échelle G1 à G4).',
      editableTable({
        items: a1.evenementsRedoutes,
        columns: [
          { key: 'valeurMetierId', label: 'Valeur métier', type: 'select', options: vmOptions, placeholder: '— choisir —', width: '200px' },
          { key: 'description', label: 'Événement redouté', type: 'textarea', placeholder: 'ex. Interruption de la production > 1 semaine' },
          { key: 'impacts', label: 'Impacts', type: 'textarea' },
          { key: 'gravite', label: 'Gravité', type: 'level', options: levelOptions(GRAVITE), width: '170px' },
          { key: '_g', label: '', type: 'computed', render: (it) => badge(`G${it.gravite}`, gClass(it.gravite), label(GRAVITE, it.gravite)), width: '50px' },
        ],
        onAdd: () => update((e) => e.atelier1.evenementsRedoutes.push({ id: nextId(e.atelier1.evenementsRedoutes, 'ER'), valeurMetierId: e.atelier1.valeursMetier[0]?.id ?? '', description: '', impacts: '', gravite: 2 })),
        addLabel: 'Événement redouté',
        onRemove: (it) => supprimer((e) => { e.atelier1.evenementsRedoutes = e.atelier1.evenementsRedoutes.filter((x) => x.id !== it.id); }, it.id),
      }),
      h('details', { class: 'scale' }, h('summary', {}, 'Échelle de gravité'),
        h('dl', {}, GRAVITE.map((g) => [h('dt', {}, badge(g.code, gClass(g.value)), ` ${g.label}`), h('dd', {}, g.desc)])))),

    card('Socle de sécurité', 'Référentiels applicables (hygiène, normes, réglementation), état d’application et écarts justifiés.',
      help('En EBIOS RM, le socle n’est pas un coefficient de calcul : les mesures existantes se reflètent ensuite dans la cotation de la probabilité de succès et de la difficulté des actions élémentaires (atelier 4).'),
      editableTable({
        items: a1.socle,
        columns: [
          { key: 'referentiel', label: 'Référentiel', placeholder: 'ex. Guide d’hygiène ANSSI' },
          { key: 'statut', label: 'État d’application', type: 'select', options: STATUT_SOCLE, width: '220px' },
          { key: 'ecarts', label: 'Écarts et justification', type: 'textarea' },
        ],
        onAdd: () => update((e) => e.atelier1.socle.push({ id: nextId(e.atelier1.socle, 'SOC'), referentiel: '', statut: 'applique', ecarts: '' })),
        addLabel: 'Référentiel',
        onRemove: (it) => supprimer((e) => { e.atelier1.socle = e.atelier1.socle.filter((x) => x.id !== it.id); }, it.id),
      })),
  ];
}
