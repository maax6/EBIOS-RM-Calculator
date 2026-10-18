import { h } from '../dom.js';
import { update, store, setStore } from '../../store.js';
import { nouvelleAction, nouveauScenarioOperationnel, graviteScenarioStrategique } from '../../core/model.js';
import { evaluerScenario, SEUIL_CHAINE_LONGUE } from '../../core/ebios.js';
import { PROBABILITE, DIFFICULTE, VRAISEMBLANCE, PHASES, MATRICE_VRAISEMBLANCE, label, code } from '../../core/scales.js';
import { card, editableTable, help, badge, levelOptions, select, supprimer, vClass } from '../components.js';

const METHODES = [
  { value: 'expresse', label: 'Expresse', desc: 'Cotation directe de la vraisemblance globale du scénario.' },
  { value: 'standard', label: 'Standard', desc: 'Probabilité de succès de chaque action élémentaire ; la vraisemblance est l’indice global de probabilité.' },
  { value: 'avancee', label: 'Avancée', desc: 'Probabilité de succès et difficulté technique de chaque action ; vraisemblance du mode opératoire le plus vraisemblable via la grille croisée.' },
];

const truncate = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function graphe(so, ev) {
  const actions = so.actions;
  if (!actions.length) return null;
  const W = 190, H = 62, GX = 70, GY = 22, PAD = 16;
  const cols = PHASES.map((p) => actions.filter((a) => a.phase === p.value));
  const pos = {};
  cols.forEach((col, ci) => col.forEach((a, ri) => { pos[a.id] = { x: PAD + ci * (W + GX), y: PAD + 26 + ri * (H + GY) }; }));
  const width = PAD * 2 + 4 * W + 3 * GX;
  const height = PAD * 2 + 26 + Math.max(1, ...cols.map((c) => c.length)) * (H + GY);
  const best = new Set(ev.meilleurMode?.chemin ?? []);
  const bestEdge = (from, to) => {
    const ch = ev.meilleurMode?.chemin ?? [];
    const i = ch.indexOf(from);
    return i >= 0 && ch[i + 1] === to;
  };
  const advanced = so.methode === 'avancee';

  return h('div', { class: 'graph-wrap' },
    h('svg', { viewBox: `0 0 ${width} ${height}`, width, height, class: 'graph', role: 'img', 'aria-label': 'Graphe d’attaque du scénario opérationnel' },
      h('defs', {}, h('marker', { id: 'arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, h('path', { d: 'M0,0 L10,5 L0,10 z', class: 'arrow-head' }))),
      PHASES.map((p, ci) => h('text', { x: PAD + ci * (W + GX) + W / 2, y: PAD + 10, class: 'phase-label', 'text-anchor': 'middle' }, p.label.toUpperCase())),
      actions.flatMap((a) => a.predecesseurs.filter((p) => pos[p]).map((p) => {
        const s = pos[p], t = pos[a.id];
        const forward = t.x > s.x;
        const x1 = forward ? s.x + W : s.x + W / 2, y1 = forward ? s.y + H / 2 : s.y + H;
        const x2 = forward ? t.x : t.x + W / 2, y2 = forward ? t.y + H / 2 : t.y;
        const d = forward ? `M${x1},${y1} C${x1 + GX / 2},${y1} ${x2 - GX / 2},${y2} ${x2},${y2}` : `M${x1},${y1} C${x1 + 40},${y1 + 10} ${x2 + 40},${y2 - 10} ${x2},${y2}`;
        return h('path', { d, class: ['edge', bestEdge(p, a.id) && 'edge-best'], 'marker-end': 'url(#arrow)' });
      })),
      actions.map((a) => {
        const { x, y } = pos[a.id];
        const cu = ev.graphe?.cumul?.[a.id];
        return h('g', { class: ['node', best.has(a.id) && 'node-best', a.finale && 'node-final'] },
          h('rect', { x, y, width: W, height: H, rx: 10 }),
          h('text', { x: x + 10, y: y + 18, class: 'node-id' }, a.id + (a.finale ? ' ◎' : '')),
          h('text', { x: x + 10, y: y + 34, class: 'node-label' }, truncate(a.label || '(sans intitulé)', 28)),
          h('text', { x: x + 10, y: y + 52, class: 'node-metrics' },
            `Pr${a.pr}${advanced ? ` · D${a.diff}` : ''}`,
            cu ? h('tspan', { class: 'node-cumul' }, `  cumul (Pr${cu.pr}${advanced ? ` · D${cu.diff}` : ''})`) : null),
          h('title', {}, `${a.id} – ${a.label}\n${code(PROBABILITE, a.pr)} ${label(PROBABILITE, a.pr)} / ${code(DIFFICULTE, a.diff)} ${label(DIFFICULTE, a.diff)}${a.justification ? `\n${a.justification}` : ''}`));
      })));
}

function matrice(pr, diff) {
  return h('table', { class: 'matrix', 'aria-label': 'Grille croisée probabilité × difficulté' },
    h('thead', {}, h('tr', {}, h('th', { class: 'matrix-corner' }, 'Pr \\ D'), DIFFICULTE.map((d) => h('th', { title: d.label, class: d.value === diff ? 'hl' : '' }, d.code)))),
    h('tbody', {}, [...PROBABILITE].reverse().map((p) => h('tr', {},
      h('th', { title: p.label, class: p.value === pr ? 'hl' : '' }, p.code),
      DIFFICULTE.map((d) => {
        const v = MATRICE_VRAISEMBLANCE[p.value][d.value];
        return h('td', { class: [vClass(v), p.value === pr && d.value === diff && 'cell-active'] }, `V${v}`);
      })))));
}

function resultat(so, ev, etude) {
  const v = ev.v;
  const ss = etude.atelier3.scenariosStrategiques.find((s) => s.id === so.ssId);
  const g = graviteScenarioStrategique(etude, ss);
  const lignes = [];
  if (so.methode === 'expresse') {
    lignes.push(so.expresse.mode === 'croise'
      ? `Croisement ${code(PROBABILITE, so.expresse.pr)} × ${code(DIFFICULTE, so.expresse.diff)} → V${ev.base}`
      : `Cotation directe : V${ev.base}`);
  } else if (ev.meilleurMode) {
    const m = ev.meilleurMode;
    lignes.push(`Mode opératoire retenu : ${m.chemin.join(' → ')}`);
    lignes.push(so.methode === 'standard'
      ? `Maillon le moins probable : Pr${m.pr}${m.chaineLongue ? ` → Pr${m.prRetenue} (chaîne longue)` : ''} ⇒ V${m.v}`
      : `Pr${m.pr} (maillon le moins probable) × D${m.diff} (maillon le plus difficile)${m.chaineLongue ? ` → corrigé Pr${m.prRetenue} × D${m.diffRetenue}` : ''} ⇒ V${m.v}`);
    lignes.push(`${ev.modes.length} mode(s) opératoire(s) évalué(s).`);
  }
  if (so.sourceDeterminee && v != null && ev.base !== v) lignes.push(`Source de risque particulièrement déterminée : V${ev.base} → V${v}`);

  const showMatrix = so.methode === 'avancee' ? ev.meilleurMode : (so.methode === 'expresse' && so.expresse.mode === 'croise' ? so.expresse : null);

  return h('aside', { class: 'result' },
    h('div', { class: 'result-head' },
      h('span', { class: 'muted small' }, 'Vraisemblance du scénario'),
      h('div', { class: ['big-score', vClass(v)] }, v == null ? '—' : `V${v}`),
      h('div', { class: 'result-label' }, v == null ? 'Non calculable' : label(VRAISEMBLANCE, v)),
      g ? h('div', { class: 'small muted' }, `Gravité associée (${ss.id}) : G${g}`) : null),
    lignes.length ? h('ul', { class: 'explain' }, lignes.map((l) => h('li', {}, l))) : null,
    ev.avertissements.length ? h('ul', { class: 'warn-list' }, ev.avertissements.map((w) => h('li', {}, w))) : null,
    showMatrix ? matrice(showMatrix.prRetenue ?? showMatrix.pr, showMatrix.diffRetenue ?? showMatrix.diff) : null,
    ev.modes.length > 1 ? h('details', { class: 'modes' }, h('summary', {}, `Détail des ${ev.modes.length} modes opératoires`),
      h('table', { class: 'table table-compact' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Chemin'), h('th', {}, 'Pr'), so.methode === 'avancee' ? h('th', {}, 'D') : null, h('th', {}, 'V'))),
        h('tbody', {}, [...ev.modes].sort((a, b) => b.v - a.v).slice(0, 30).map((m) => h('tr', { class: m === ev.meilleurMode ? 'row-best' : '' },
          h('td', {}, m.chemin.join(' → ') + (m.chaineLongue ? ' *' : '')), h('td', {}, m.prRetenue), so.methode === 'avancee' ? h('td', {}, m.diffRetenue) : null, h('td', {}, badge(`V${m.v}`, vClass(m.v)))))))) : null);
}

export function viewAtelier4(etude) {
  const sos = etude.atelier4.scenariosOperationnels;
  if (!sos.find((s) => s.id === store.soActif)) store.soActif = sos[0]?.id ?? null;
  const so = sos.find((s) => s.id === store.soActif);

  const tabs = h('div', { class: 'so-tabs', role: 'tablist' },
    sos.map((s) => {
      const ev = evaluerScenario(s);
      return h('button', { type: 'button', role: 'tab', class: ['so-tab', s.id === store.soActif && 'active'], 'aria-selected': String(s.id === store.soActif), onclick: () => setStore({ soActif: s.id }) },
        h('code', {}, s.id), ' ', truncate(s.titre || 'Sans titre', 30), ' ', badge(ev.v == null ? '—' : `V${ev.v}`, vClass(ev.v)));
    }),
    h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => {
      const n = nouveauScenarioOperationnel(store.etude);
      update((e) => e.atelier4.scenariosOperationnels.push(n), { render: false });
      setStore({ soActif: n.id });
    } }, '+ Scénario opérationnel'));

  if (!so) {
    return [card('Scénarios opérationnels', 'Déclinez chaque scénario stratégique en modes opératoires techniques (graphe d’attaque) et évaluez leur vraisemblance.',
      tabs, help('Créez un premier scénario opérationnel pour commencer. Astuce : chargez l’étude d’exemple pour voir un graphe complet.'))];
  }

  const ev = evaluerScenario(so);
  const set = (fn, render = true) => update(() => fn(so), { render });
  const ssOptions = etude.atelier3.scenariosStrategiques.map((s) => ({ value: s.id, label: `${s.id} · ${truncate(s.description || 'sans description', 60)}` }));
  const isGraph = so.methode !== 'expresse';

  const actionCols = [
    { key: 'label', label: 'Action élémentaire', type: 'textarea', placeholder: 'ex. Hameçonnage ciblé du service RH', minWidth: '220px' },
    { key: 'phase', label: 'Étape', type: 'select', options: PHASES, width: '120px' },
    { key: 'pr', label: 'Probabilité', type: 'level', options: levelOptions(PROBABILITE), width: '170px' },
    so.methode === 'avancee' ? { key: 'diff', label: 'Difficulté', type: 'level', options: levelOptions(DIFFICULTE), width: '160px' } : null,
    { key: 'predecesseurs', label: 'Antécédents', type: 'chips', options: (a) => so.actions.filter((x) => x.id !== a.id).map((x) => ({ value: x.id, label: x.id, title: x.label })), empty: 'Point d’entrée', minWidth: '210px' },
    { key: 'finale', label: 'Objectif', title: 'Action finale : atteinte de l’objectif visé', type: 'checkbox', width: '64px' },
    { key: '_c', label: 'Cumul', type: 'computed', width: '90px', render: (a) => { const c = ev.graphe?.cumul?.[a.id]; return c ? h('span', { class: 'small mono' }, `Pr${c.pr}${so.methode === 'avancee' ? ` D${c.diff}` : ''}`) : '—'; } },
    { key: 'justification', label: 'Justification / mesures existantes', type: 'textarea', minWidth: '200px' },
  ].filter(Boolean);

  return [
    card('Scénarios opérationnels', 'Déclinez chaque scénario stratégique en modes opératoires techniques (graphe d’attaque) et évaluez leur vraisemblance.', tabs),
    h('div', { class: 'so-layout' },
      h('div', { class: 'so-main' },
        card(null, null,
          h('div', { class: 'grid-form' },
            h('label', { class: 'field' }, h('span', {}, 'Intitulé'), h('input', { class: 'input', value: so.titre, placeholder: 'ex. Vol de données R&D par hameçonnage', oninput: (e) => set((s) => { s.titre = e.target.value; }, false) })),
            h('label', { class: 'field' }, h('span', {}, 'Scénario stratégique'), select({ value: so.ssId, options: ssOptions, placeholder: '— aucun —', onChange: (v) => set((s) => { s.ssId = v; }) }))),
          h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': 'Méthode de cotation' },
            METHODES.map((m) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(so.methode === m.value), class: ['seg', so.methode === m.value && 'seg-on'], title: m.desc, onclick: () => set((s) => { s.methode = m.value; }) }, m.label))),
          help(METHODES.find((m) => m.value === so.methode).desc),
          h('div', { class: 'options' },
            isGraph ? h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: so.correctionChaineLongue, onchange: (e) => set((s) => { s.correctionChaineLongue = e.target.checked; }) }), ` Corriger les séquences longues (≥ ${SEUIL_CHAINE_LONGUE} actions)`) : null,
            h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: so.sourceDeterminee, onchange: (e) => set((s) => { s.sourceDeterminee = e.target.checked; }) }), ' Source de risque particulièrement déterminée (+1 niveau)')),
          h('div', { class: 'row-end' }, h('button', { type: 'button', class: 'btn btn-ghost btn-danger', onclick: () => supprimer((e) => { e.atelier4.scenariosOperationnels = e.atelier4.scenariosOperationnels.filter((x) => x.id !== so.id); }, `le scénario ${so.id}`) }, 'Supprimer ce scénario'))),

        so.methode === 'expresse'
          ? card('Cotation expresse', 'Estimez directement la vraisemblance, ou croisez probabilité de succès et difficulté technique globales.',
            h('div', { class: 'segmented' },
              [['direct', 'Cotation directe'], ['croise', 'Probabilité × difficulté']].map(([v, l]) => h('button', { type: 'button', class: ['seg', so.expresse.mode === v && 'seg-on'], onclick: () => set((s) => { s.expresse.mode = v; }) }, l))),
            so.expresse.mode === 'direct'
              ? h('label', { class: 'field' }, h('span', {}, 'Vraisemblance'), select({ value: so.expresse.v, options: levelOptions(VRAISEMBLANCE), onChange: (v) => set((s) => { s.expresse.v = Number(v); }) }))
              : h('div', { class: 'grid-form' },
                h('label', { class: 'field' }, h('span', {}, 'Probabilité de succès'), select({ value: so.expresse.pr, options: levelOptions(PROBABILITE), onChange: (v) => set((s) => { s.expresse.pr = Number(v); }) })),
                h('label', { class: 'field' }, h('span', {}, 'Difficulté technique'), select({ value: so.expresse.diff, options: levelOptions(DIFFICULTE), onChange: (v) => set((s) => { s.expresse.diff = Number(v); }) }))))
          : card('Graphe d’attaque', 'Une action sans antécédent est un point d’entrée. Plusieurs antécédents = chemins alternatifs (l’attaquant retient le plus favorable). Cochez « Objectif » sur la ou les actions finales.',
            editableTable({
              items: so.actions, columns: actionCols,
              onAdd: () => set((s) => {
                const last = s.actions[s.actions.length - 1];
                const a = nouvelleAction(s.actions, last?.phase ?? 'connaitre');
                if (last) a.predecesseurs = [last.id];
                s.actions.push(a);
              }),
              addLabel: 'Action élémentaire',
              onRemove: (a) => supprimer((e) => { const s = e.atelier4.scenariosOperationnels.find((x) => x.id === so.id); s.actions = s.actions.filter((x) => x.id !== a.id); }, a.id),
              emptyText: 'Aucune action. Ajoutez la première action (souvent une reconnaissance : « Connaître »).',
            }),
            graphe(so, ev),
            h('details', { class: 'scale' }, h('summary', {}, 'Échelles de cotation des actions élémentaires'),
              h('div', { class: 'scales-2' },
                h('dl', {}, h('dt', {}, h('strong', {}, 'Probabilité de succès')), PROBABILITE.map((p) => [h('dt', {}, `${p.code} ${p.label}`), h('dd', {}, p.desc)])),
                so.methode === 'avancee' ? h('dl', {}, h('dt', {}, h('strong', {}, 'Difficulté technique')), DIFFICULTE.map((d) => [h('dt', {}, `${d.code} ${d.label}`), h('dd', {}, d.desc)])) : null)),
            help('Probabilité : plutôt liée aux capacités de défense et de résilience (supervision, réaction). Difficulté : plutôt liée au niveau de protection (exposition, vulnérabilités).'))),
      h('div', { class: 'so-side' }, resultat(so, ev, etude))),
  ];
}
