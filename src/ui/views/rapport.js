import { h } from '../dom.js';
import { deriverRisques, controlesCoherence, graviteScenarioStrategique } from '../../core/model.js';
import { niveauMenace, zoneMenace, pertinenceSROV } from '../../core/ebios.js';
import { GRAVITE, STATUT_SOCLE, PERTINENCE, OPTIONS_TRAITEMENT, NIVEAUX_RISQUE, VRAISEMBLANCE, label } from '../../core/scales.js';
import { badge, vClass, gClass, riskClass } from '../components.js';
import { carto } from './atelier5.js';

const ZONES = { danger: 'Danger', controle: 'Contrôle', veille: 'Veille', hors: 'Hors périmètre' };
const METHODES = { expresse: 'Expresse', standard: 'Standard', avancee: 'Avancée' };
const table = (head, rows) => h('table', { class: 'table table-compact' }, h('thead', {}, h('tr', {}, head.map((x) => h('th', {}, x)))), h('tbody', {}, rows.length ? rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, c)))) : h('tr', {}, h('td', { colspan: head.length, class: 'empty' }, '—'))));

export function viewRapport(etude) {
  const { meta, atelier1: a1, atelier2: a2, atelier3: a3 } = etude;
  const risques = deriverRisques(etude);
  const seuilsM = etude.parametres.seuilsMenace;
  const warnings = controlesCoherence(etude);
  const nb = (n) => risques.filter((r) => r.niveau === n).length;
  const nbRes = (n) => risques.filter((r) => r.niveauResiduel === n).length;

  return [h('article', { class: 'report' },
    h('header', { class: 'report-head' },
      h('p', { class: 'eyebrow' }, 'Rapport d’analyse de risques – méthode EBIOS Risk Manager'),
      h('h1', {}, meta.titre || 'Étude sans titre'),
      h('p', { class: 'muted' }, [meta.organisation, meta.perimetre, meta.auteur && `Auteur : ${meta.auteur}`, meta.date].filter(Boolean).join(' · ')),
      h('div', { class: 'kpis' },
        h('div', { class: 'kpi' }, h('strong', {}, risques.length), h('span', {}, 'risques')),
        h('div', { class: 'kpi risk-eleve' }, h('strong', {}, `${nb('eleve')} → ${nbRes('eleve')}`), h('span', {}, 'inacceptables (initial → résiduel)')),
        h('div', { class: 'kpi risk-moyen' }, h('strong', {}, `${nb('moyen')} → ${nbRes('moyen')}`), h('span', {}, 'tolérables sous contrôle')),
        h('div', { class: 'kpi risk-faible' }, h('strong', {}, `${nb('faible')} → ${nbRes('faible')}`), h('span', {}, 'acceptables')))),

    h('h2', {}, '1. Cadrage et socle de sécurité'),
    table(['Id', 'Valeur métier', 'Nature'], a1.valeursMetier.map((v) => [v.id, v.nom, v.nature])),
    table(['Id', 'Événement redouté', 'Valeur métier', 'Gravité'], a1.evenementsRedoutes.map((e) => [e.id, e.description, e.valeurMetierId, badge(`G${e.gravite} ${label(GRAVITE, e.gravite)}`, gClass(e.gravite))])),
    table(['Référentiel', 'État', 'Écarts'], a1.socle.map((s) => [s.referentiel, label(STATUT_SOCLE, s.statut), s.ecarts])),

    h('h2', {}, '2. Sources de risque'),
    table(['Id', 'Source', 'Objectif visé', 'Pertinence', 'Retenu'], a2.couples.map((c) => [c.id, c.source, c.objectif, label(PERTINENCE, pertinenceSROV(c.motivation, c.ressources)), c.retenu ? 'Oui' : 'Non'])),

    h('h2', {}, '3. Scénarios stratégiques'),
    table(['Id', 'Partie prenante', 'Niveau de menace', 'Zone'], a3.partiesPrenantes.map((p) => { const n = niveauMenace(p, { sansConfiance: p.sansConfiance }); const z = zoneMenace(n, seuilsM); return [p.id, p.nom, n.toLocaleString('fr-FR'), badge(ZONES[z], `zone-${z}`)]; })),
    table(['Id', 'Chemin d’attaque', 'Couple', 'ER', 'Gravité'], a3.scenariosStrategiques.map((s) => { const g = graviteScenarioStrategique(etude, s); return [s.id, s.description, s.coupleId, s.evenementIds.join(', '), g ? badge(`G${g}`, gClass(g)) : '—']; })),

    h('h2', {}, '4. Scénarios opérationnels'),
    table(['Risque', 'Scénario', 'Méthode', 'Mode opératoire retenu', 'Vraisemblance'], risques.map((r) => [r.id, r.titre, METHODES[r.evaluation.methode], r.evaluation.meilleurMode?.chemin.join(' → ') ?? '—', r.vraisemblance == null ? '—' : badge(`V${r.vraisemblance} ${label(VRAISEMBLANCE, r.vraisemblance)}`, vClass(r.vraisemblance))])),

    h('h2', {}, '5. Traitement du risque'),
    h('div', { class: 'cartos' }, carto(risques, etude.parametres.seuilsRisque, { titre: 'Risques initiaux' }), carto(risques, etude.parametres.seuilsRisque, { titre: 'Risques résiduels', residuel: true })),
    table(['Risque', 'Initial', 'Option', 'Mesures', 'Responsable', 'Échéance', 'Résiduel'], risques.map((r) => [
      r.id, r.niveau ? badge(NIVEAUX_RISQUE[r.niveau].short, riskClass(r.niveau)) : '—', r.traitement ? label(OPTIONS_TRAITEMENT, r.traitement.option) : '—',
      r.traitement?.mesures ?? '', r.traitement?.responsable ?? '', r.traitement?.echeance ?? '', r.niveauResiduel ? badge(NIVEAUX_RISQUE[r.niveauResiduel].short, riskClass(r.niveauResiduel)) : '—'])),

    warnings.length ? [h('h2', {}, 'Points de vigilance'), h('ul', { class: 'warn-list' }, warnings.map((w) => h('li', {}, `Atelier ${w.atelier} – ${w.msg}`)))] : null,
    h('p', { class: 'muted small disclaimer' }, 'Document généré avec EBIOS RM Calculator, outil non officiel et non labellisé par l’ANSSI. Les cotations relèvent du jugement du groupe de travail.'))];
}
