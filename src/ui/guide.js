/**
 * Mode guidé : la méthode découpée en étapes courtes, une carte d'atelier à la fois,
 * avec ce qu'il faut faire, pourquoi, un exemple et l'état d'avancement.
 */
import { h } from './dom.js';
import { store, setStore } from '../store.js';
import { evaluerScenario } from '../core/ebios.js';
import { deriverRisques, controlesCoherence } from '../core/model.js';

const n = (k, sing, plur) => `${k} ${k > 1 ? plur : sing}`;

/**
 * vue : id de la vue d'atelier (main.js) ; carte : index de la carte à afficher, ou null pour la vue entière.
 * etat(e) → { ok: true|false|null, texte } ; null = étape facultative ou de lecture.
 */
export const ETAPES = [
  {
    atelier: 1, vue: 'cadrage', carte: 0, titre: 'Présenter l’étude',
    quoi: 'Donnez un titre à l’étude, nommez l’organisation et décrivez le périmètre analysé. Ces informations ouvrent le rapport.',
    pourquoi: 'Le périmètre fixe ce qui entre dans l’analyse. Un périmètre flou produit des scénarios qui débordent et une étude qui ne se termine pas.',
    exemple: '« R&D et production de vaccins » chez BioVax (organisation fictive).',
    etat: (e) => (e.meta.perimetre.trim() && e.meta.titre.trim() && e.meta.titre !== 'Nouvelle étude'
      ? { ok: true, texte: 'Titre et périmètre renseignés.' }
      : { ok: false, texte: 'Renseignez au moins le titre et le périmètre.' }),
  },
  {
    atelier: 1, vue: 'cadrage', carte: 1, titre: 'Lister les valeurs métier',
    quoi: 'Notez ce que l’organisation doit protéger : ses processus essentiels, ses informations clés, son savoir-faire. Trois à cinq valeurs suffisent pour commencer.',
    pourquoi: 'Tout le reste s’y rattache : un événement redouté est toujours l’atteinte à une valeur métier.',
    exemple: '« Rechercher et développer des vaccins » (processus), « Traçabilité et contrôle » (information).',
    etat: (e) => {
      const k = e.atelier1.valeursMetier.length;
      return k ? { ok: true, texte: `${n(k, 'valeur métier saisie', 'valeurs métier saisies')}.` } : { ok: false, texte: 'Ajoutez au moins une valeur métier.' };
    },
  },
  {
    atelier: 1, vue: 'cadrage', carte: 2, titre: 'Identifier les biens supports',
    quoi: 'Pour chaque valeur métier, listez ce qui la fait fonctionner : serveurs, applications, réseaux, locaux, prestataires.',
    pourquoi: 'Ce sont eux que l’attaquant vise concrètement. Vous les retrouverez en construisant les scénarios opérationnels.',
    exemple: 'Le réseau du laboratoire R&D, les serveurs de l’infogéreur, le site web du comité d’entreprise.',
    etat: (e) => {
      const k = e.atelier1.biensSupports.length;
      return k ? { ok: true, texte: `${n(k, 'bien support saisi', 'biens supports saisis')}.` } : { ok: false, texte: 'Ajoutez au moins un bien support.' };
    },
  },
  {
    atelier: 1, vue: 'cadrage', carte: 3, titre: 'Coter les événements redoutés',
    quoi: 'Décrivez ce qui serait grave pour chaque valeur métier (fuite, arrêt, altération), puis cotez la gravité de G1 Mineure à G4 Critique.',
    pourquoi: 'La gravité des risques vient d’ici. Un événement qui n’est rattaché à aucune valeur métier ne pourra pas être exploité.',
    exemple: '« Interruption de la production pendant plus d’une semaine », gravité G4 Critique.',
    etat: (e) => {
      const ers = e.atelier1.evenementsRedoutes;
      if (!ers.length) return { ok: false, texte: 'Ajoutez au moins un événement redouté.' };
      const orphelins = ers.filter((x) => !x.valeurMetierId).length;
      return orphelins
        ? { ok: false, texte: `${n(orphelins, 'événement n’est rattaché', 'événements ne sont rattachés')} à aucune valeur métier.` }
        : { ok: true, texte: `${n(ers.length, 'événement redouté coté', 'événements redoutés cotés')}.` };
    },
  },
  {
    atelier: 1, vue: 'cadrage', carte: 4, titre: 'Décrire le socle de sécurité',
    quoi: 'Indiquez les référentiels que l’organisation applique déjà (guide d’hygiène de l’ANSSI, ISO 27001, réglementation du secteur) et les écarts connus.',
    pourquoi: 'Le socle sert de point de départ. Les mesures existantes se retrouvent ensuite dans la cotation des actions de l’atelier 4.',
    exemple: 'Guide d’hygiène ANSSI, appliqué avec restrictions : administration non cloisonnée sur le site de Paris.',
    etat: (e) => (e.atelier1.socle.length
      ? { ok: true, texte: `${n(e.atelier1.socle.length, 'référentiel décrit', 'référentiels décrits')}.` }
      : { ok: null, texte: 'Étape facultative, utile pour le rapport.' }),
  },
  {
    atelier: 2, vue: 'sources', carte: 0, titre: 'Choisir les sources de risque',
    quoi: 'Pour chaque attaquant plausible, notez son objectif : voler, saboter, revendiquer… Évaluez la pertinence de chaque couple, puis cochez ceux que vous retenez.',
    pourquoi: 'Les couples retenus décident des scénarios étudiés ensuite. Deux ou trois couples bien choisis valent mieux que dix survolés.',
    exemple: 'Un concurrent qui veut voler des travaux de R&D ; un hacktiviste anti-vaccin qui veut saboter la production.',
    etat: (e) => {
      const k = e.atelier2.couples.filter((c) => c.retenu).length;
      return k ? { ok: true, texte: `${n(k, 'couple retenu', 'couples retenus')}.` } : { ok: false, texte: 'Retenez au moins un couple source de risque / objectif visé.' };
    },
  },
  {
    atelier: 3, vue: 'strategiques', carte: 0, titre: 'Cartographier l’écosystème',
    quoi: 'Listez les parties prenantes (prestataires, partenaires, fournisseurs) et cotez de 1 à 4 la dépendance, la pénétration, la maturité cyber et la confiance.',
    pourquoi: 'Un attaquant passe souvent par un tiers moins protégé. Le niveau de menace calculé place chaque partie prenante dans une zone du radar.',
    exemple: 'L’infogéreur IT, très présent dans le système d’information, ressort en zone de contrôle.',
    etat: (e) => (e.atelier3.partiesPrenantes.length
      ? { ok: true, texte: `${n(e.atelier3.partiesPrenantes.length, 'partie prenante cotée', 'parties prenantes cotées')}.` }
      : { ok: null, texte: 'Facultatif si aucun tiers n’a accès au périmètre.' }),
  },
  {
    atelier: 3, vue: 'strategiques', carte: 1, titre: 'Écrire les scénarios stratégiques',
    quoi: 'Pour chaque couple retenu, décrivez en une phrase le chemin de l’attaquant vers son objectif, éventuellement par une partie prenante. Rattachez les événements redoutés visés.',
    pourquoi: 'La gravité du scénario est celle du pire événement redouté rattaché. Sans événement, elle ne peut pas être calculée.',
    exemple: 'Un concurrent vole des travaux de R&D en passant par le système d’information du laboratoire partenaire.',
    etat: (e) => {
      const ss = e.atelier3.scenariosStrategiques;
      if (!ss.length) return { ok: false, texte: 'Écrivez au moins un scénario stratégique.' };
      const incomplets = ss.filter((s) => !s.coupleId || !s.evenementIds.length).length;
      return incomplets
        ? { ok: false, texte: `${n(incomplets, 'scénario sans couple ou sans événement redouté', 'scénarios sans couple ou sans événement redouté')}.` }
        : { ok: true, texte: `${n(ss.length, 'scénario stratégique complet', 'scénarios stratégiques complets')}.` };
    },
  },
  {
    atelier: 4, vue: 'operationnels', carte: null, titre: 'Construire les scénarios opérationnels',
    quoi: 'Déclinez chaque scénario stratégique en actions élémentaires (connaître, rentrer, trouver, exploiter). Cotez la probabilité de succès de chaque action et reliez-les entre elles : l’outil calcule la vraisemblance.',
    pourquoi: 'La vraisemblance (V0 à V4) vient du maillon le moins probable du meilleur chemin d’attaque. Si le graphe vous paraît lourd, commencez en méthode expresse.',
    exemple: 'Hameçonnage ciblé d’un chercheur (Rentrer, Pr3), puis latéralisation vers le réseau R&D (Trouver, Pr4).',
    etat: (e) => {
      const sos = e.atelier4.scenariosOperationnels;
      if (!sos.length) return { ok: false, texte: 'Créez au moins un scénario opérationnel.' };
      const sansV = sos.filter((so) => !so.ssId || evaluerScenario(so).v == null).length;
      return sansV
        ? { ok: false, texte: `${n(sansV, 'scénario sans vraisemblance ou sans scénario stratégique', 'scénarios sans vraisemblance ou sans scénario stratégique')}.` }
        : { ok: true, texte: `${n(sos.length, 'scénario évalué', 'scénarios évalués')}.` };
    },
  },
  {
    atelier: 5, vue: 'traitement', carte: 0, titre: 'Lire la cartographie des risques',
    quoi: 'Chaque scénario opérationnel devient un risque, placé selon sa gravité et sa vraisemblance. Vérifiez que ce classement vous paraît juste.',
    pourquoi: 'C’est la vue que la direction regardera. Les seuils d’acceptation sont une convention à faire valider par la gouvernance.',
    exemple: 'R2 (sabotage de la production) : gravité G4, vraisemblance V3, donc inacceptable en l’état.',
    etat: (e) => {
      const k = deriverRisques(e).length;
      return k ? { ok: null, texte: `${n(k, 'risque placé', 'risques placés')} sur la cartographie.` } : { ok: false, texte: 'Aucun risque : revenez à l’étape des scénarios opérationnels.' };
    },
  },
  {
    atelier: 5, vue: 'traitement', carte: 1, titre: 'Décider du traitement',
    quoi: 'Pour chaque risque, choisissez une option (réduire, transférer, accepter, refuser), notez les mesures, un responsable, une échéance, puis le niveau visé après traitement.',
    pourquoi: 'Le plan de traitement est le livrable concret : qui fait quoi, et quel risque reste une fois les mesures en place.',
    exemple: 'Réduire R1 en cloisonnant le réseau R&D, sous la responsabilité du RSSI, avant le 31/03/2027.',
    etat: (e) => {
      const risques = deriverRisques(e);
      if (!risques.length) return { ok: false, texte: 'Aucun risque à traiter pour l’instant.' };
      const sans = risques.filter((r) => !r.traitement?.mesures?.trim()).length;
      return sans
        ? { ok: false, texte: `${n(sans, 'risque sans mesure', 'risques sans mesure')}.` }
        : { ok: true, texte: 'Chaque risque a ses mesures.' };
    },
  },
  {
    atelier: null, vue: 'rapport', carte: null, titre: 'Relire et exporter',
    quoi: 'Relisez la synthèse, puis imprimez-la en PDF ou exportez l’étude en JSON pour la reprendre plus tard.',
    pourquoi: 'L’étude n’est enregistrée que dans ce navigateur. Le fichier JSON est votre sauvegarde et le moyen de la transmettre.',
    exemple: null,
    etat: () => ({ ok: null, texte: 'Boutons JSON et Imprimer / PDF en haut de page.' }),
  },
];

/** Première étape qui correspond à une vue d'atelier (passage du mode expert au mode guidé). */
export const etapeDeVue = (vue) => Math.max(0, ETAPES.findIndex((s) => s.vue === vue));

const ICONES = { true: '✓', false: '•', null: '–' };

const progression = (faits) => `${faits} étape${faits > 1 ? 's' : ''} sur ${ETAPES.length} complète${faits > 1 ? 's' : ''}`;

const ligneEtat = (etat) => [h('span', { 'aria-hidden': 'true' }, `${ICONES[etat.ok]} `), etat.texte];

/** Met à jour l'état affiché sans redessiner la page (la saisie de texte garde ainsi le focus). */
export function majEtatGuide(etude) {
  const el = document.getElementById('guide-etat');
  if (!el) return;
  const etats = ETAPES.map((s) => s.etat(etude));
  const etat = etats[store.etape];
  el.className = `guide-etat guide-ok-${etat.ok}`;
  el.replaceChildren(...ligneEtat(etat).map((c) => (c instanceof Node ? c : document.createTextNode(c))));
  document.querySelectorAll('[data-etape]').forEach((b) => {
    const ok = etats[Number(b.dataset.etape)].ok;
    b.classList.remove('guide-ok-true', 'guide-ok-false', 'guide-ok-null');
    b.classList.add(`guide-ok-${ok}`);
    b.querySelector('.guide-mark').textContent = ICONES[ok];
  });
  const faits = etats.filter((s) => s.ok === true).length;
  document.getElementById('guide-progress').textContent = progression(faits);
  document.getElementById('guide-bar-fill').style.width = `${(faits / ETAPES.length) * 100}%`;
}

function allerA(i) {
  setStore({ etape: i, vue: ETAPES[i].vue });
  window.scrollTo(0, 0);
  document.getElementById('guide-titre')?.focus({ preventScroll: true });
}

export function viewGuide(etude, VUES) {
  const i = Math.min(Math.max(store.etape ?? 0, 0), ETAPES.length - 1);
  const etape = ETAPES[i];
  const etats = ETAPES.map((s) => s.etat(etude));
  const etat = etats[i];
  const vue = VUES.find((v) => v.id === etape.vue);
  const contenu = [vue.view(etude)].flat();
  const cartes = etape.carte == null ? contenu : [contenu[etape.carte]];
  const faits = etats.filter((s) => s.ok === true).length;
  const vigilance = etape.carte == null || etape.carte === contenu.length - 1
    ? controlesCoherence(etude).filter((w) => w.atelier === etape.atelier)
    : [];

  return h('div', { class: 'guide' },
    h('nav', { class: 'guide-steps', 'aria-label': 'Étapes de l’étude' },
      h('p', { class: 'guide-progress', id: 'guide-progress' }, progression(faits)),
      h('div', { class: 'guide-bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': ETAPES.length, 'aria-valuenow': faits, 'aria-label': 'Avancement' },
        h('span', { id: 'guide-bar-fill', style: { width: `${(faits / ETAPES.length) * 100}%` } })),
      h('ol', {}, ETAPES.map((s, k) => {
        const debutAtelier = k === 0 || ETAPES[k - 1].atelier !== s.atelier;
        return [
          debutAtelier ? h('li', { class: 'guide-group', 'aria-hidden': 'true' }, s.atelier ? `Atelier ${s.atelier}` : 'Synthèse') : null,
          h('li', {},
            h('button', {
              type: 'button', class: ['guide-step', k === i && 'guide-step-on', `guide-ok-${etats[k].ok}`], 'data-etape': k,
              'aria-current': k === i ? 'step' : null, onclick: () => allerA(k),
            }, h('span', { class: 'guide-mark', 'aria-hidden': 'true' }, ICONES[etats[k].ok]), h('span', {}, s.titre),
            h('span', { class: 'sr-only' }, etats[k].ok === true ? ' (fait)' : etats[k].ok === false ? ' (à faire)' : ''))),
        ];
      }))),
    h('div', { class: 'guide-main' },
      h('section', { class: 'card guide-intro' },
        h('p', { class: 'guide-kicker' }, `Étape ${i + 1} sur ${ETAPES.length}${etape.atelier ? `, atelier ${etape.atelier}` : ''}`),
        h('h2', { id: 'guide-titre', tabindex: '-1' }, etape.titre),
        h('p', { class: 'guide-quoi' }, etape.quoi),
        h('p', { class: 'guide-pourquoi' }, h('strong', {}, 'Pourquoi : '), etape.pourquoi),
        etape.exemple ? h('p', { class: 'guide-exemple' }, h('strong', {}, 'Exemple : '), etape.exemple) : null,
        h('p', { class: ['guide-etat', `guide-ok-${etat.ok}`], id: 'guide-etat', role: 'status' }, ligneEtat(etat))),
      cartes,
      vigilance.length
        ? h('section', { class: 'card card-warn' }, h('h3', {}, 'Points de vigilance'), h('ul', {}, vigilance.map((w) => h('li', {}, w.msg))))
        : null,
      h('div', { class: 'guide-nav' },
        i > 0 ? h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => allerA(i - 1) }, `Étape précédente : ${ETAPES[i - 1].titre}`) : h('span'),
        i < ETAPES.length - 1
          ? h('button', { type: 'button', class: 'btn btn-primary', onclick: () => allerA(i + 1) }, `Étape suivante : ${ETAPES[i + 1].titre}`)
          : h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { setStore({ mode: 'expert', vue: 'rapport' }); } }, 'Terminer et passer en mode expert'))));
}
