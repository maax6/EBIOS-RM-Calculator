/**
 * Étude d'exemple inspirée du cas « société de biotechnologie fabriquant des vaccins »
 * utilisé dans le guide EBIOS Risk Manager de l'ANSSI. Les cotations du graphe d'attaque
 * reprennent celles de la fiche méthode 8 (indice global de probabilité de succès = 3).
 * Données fictives, à visée pédagogique.
 */
export function etudeExemple() {
  return {
    version: 3,
    meta: { titre: 'Exemple – Biotech vaccins (inspiré du guide ANSSI)', organisation: 'BioVax (fictif)', perimetre: 'R&D et production de vaccins', auteur: 'Démo', date: '2026-10-18' },
    parametres: { seuilsMenace: { danger: 3, controle: 1.5, veille: 0.5 }, seuilsRisque: { moyen: 5, eleve: 7 } },
    atelier1: {
      valeursMetier: [
        { id: 'VM1', nom: 'Rechercher et développer des vaccins', nature: 'Processus', description: 'Travaux de R&D, résultats d’essais, formules.' },
        { id: 'VM2', nom: 'Fabriquer des vaccins', nature: 'Processus', description: 'Production industrielle et contrôle qualité.' },
        { id: 'VM3', nom: 'Traçabilité et contrôle', nature: 'Information', description: 'Dossiers de lots, données réglementaires.' },
      ],
      biensSupports: [
        { id: 'BS1', nom: 'Serveurs R&D et bases de données d’essais', valeurMetierIds: ['VM1'], responsable: 'DSI' },
        { id: 'BS2', nom: 'Système industriel de production (SCADA)', valeurMetierIds: ['VM2'], responsable: 'Direction industrielle' },
        { id: 'BS3', nom: 'Système de traçabilité', valeurMetierIds: ['VM3'], responsable: 'Qualité' },
      ],
      evenementsRedoutes: [
        { id: 'ER1', valeurMetierId: 'VM1', description: 'Fuite des informations stratégiques de R&D', impacts: 'Perte d’avantage concurrentiel, image', gravite: 3 },
        { id: 'ER2', valeurMetierId: 'VM2', description: 'Interruption de la production pendant plus d’une semaine', impacts: 'Pertes financières, impact sanitaire', gravite: 4 },
        { id: 'ER3', valeurMetierId: 'VM3', description: 'Altération des données de traçabilité', impacts: 'Rappel de lots, juridique', gravite: 3 },
      ],
      socle: [
        { id: 'SOC1', referentiel: 'Guide d’hygiène informatique ANSSI', statut: 'restrictions', ecarts: 'Administration non cloisonnée sur le site de Paris.' },
        { id: 'SOC2', referentiel: 'ISO/IEC 27001', statut: 'applique', ecarts: '' },
        { id: 'SOC3', referentiel: 'Bonnes pratiques de fabrication (BPF)', statut: 'applique', ecarts: '' },
      ],
    },
    atelier2: {
      couples: [
        { id: 'SROV1', source: 'Concurrent', objectif: 'Voler des informations de R&D', motivation: 3, ressources: 2, retenu: true },
        { id: 'SROV2', source: 'Hacktiviste anti-vaccin', objectif: 'Saboter la production', motivation: 3, ressources: 1, retenu: true },
        { id: 'SROV3', source: 'Cybercriminel', objectif: 'Rançonner l’organisation', motivation: 2, ressources: 3, retenu: true },
        { id: 'SROV4', source: 'Officine spécialisée', objectif: 'Altérer la traçabilité', motivation: 1, ressources: 2, retenu: false },
      ],
    },
    atelier3: {
      partiesPrenantes: [
        { id: 'PP1', nom: 'Prestataire d’entretien des locaux', categorie: 'Prestataire', dependance: 2, penetration: 2, maturite: 1, confiance: 2, sansConfiance: false },
        { id: 'PP2', nom: 'Laboratoire partenaire', categorie: 'Partenaire', dependance: 3, penetration: 3, maturite: 2, confiance: 3, sansConfiance: false },
        { id: 'PP3', nom: 'Infogéreur IT', categorie: 'Prestataire', dependance: 4, penetration: 4, maturite: 3, confiance: 3, sansConfiance: false },
        { id: 'PP4', nom: 'Comité d’entreprise (site web)', categorie: 'Interne', dependance: 1, penetration: 2, maturite: 1, confiance: 3, sansConfiance: true },
        { id: 'PP5', nom: 'Fournisseur de réactifs', categorie: 'Fournisseur', dependance: 2, penetration: 1, maturite: 2, confiance: 2, sansConfiance: false },
      ],
      scenariosStrategiques: [
        { id: 'SS1', coupleId: 'SROV1', description: 'Un concurrent vole des travaux de R&D en passant par le SI bureautique ou un prestataire', evenementIds: ['ER1'], ppIds: ['PP1', 'PP4'] },
        { id: 'SS2', coupleId: 'SROV2', description: 'Un hacktiviste sabote la production via l’infogéreur', evenementIds: ['ER2', 'ER3'], ppIds: ['PP3'] },
      ],
    },
    atelier4: {
      scenariosOperationnels: [
        {
          id: 'SO1', ssId: 'SS1', titre: 'Vol de données R&D (exemple de la fiche méthode 8)', methode: 'standard',
          expresse: { mode: 'direct', v: 3, pr: 3, diff: 2 }, correctionChaineLongue: true, sourceDeterminee: false,
          actions: [
            { id: 'AE1', label: 'Reconnaissance externe sources ouvertes', phase: 'connaitre', pr: 3, diff: 0, predecesseurs: [], finale: false, justification: '' },
            { id: 'AE2', label: 'Intrusion via un canal d’accès préexistant', phase: 'rentrer', pr: 2, diff: 3, predecesseurs: [], finale: false, justification: '' },
            { id: 'AE3', label: 'Intrusion via mail d’hameçonnage sur service RH', phase: 'rentrer', pr: 4, diff: 1, predecesseurs: ['AE1'], finale: false, justification: 'Service RH très exposé, pas de bac à sable.' },
            { id: 'AE4', label: 'Intrusion via le site du CE (point d’eau)', phase: 'rentrer', pr: 4, diff: 2, predecesseurs: ['AE1'], finale: false, justification: '' },
            { id: 'AE5', label: 'Corruption d’un personnel de l’équipe R&D', phase: 'rentrer', pr: 1, diff: 2, predecesseurs: [], finale: false, justification: '' },
            { id: 'AE6', label: 'Corruption d’un prestataire d’entretien des locaux', phase: 'rentrer', pr: 3, diff: 1, predecesseurs: ['AE2'], finale: false, justification: '' },
            { id: 'AE7', label: 'Reconnaissance interne réseaux bureautique & IT', phase: 'trouver', pr: 3, diff: 1, predecesseurs: ['AE2', 'AE3', 'AE4'], finale: false, justification: '' },
            { id: 'AE8', label: 'Latéralisation vers réseaux LAN et R&D', phase: 'trouver', pr: 4, diff: 2, predecesseurs: ['AE7'], finale: false, justification: 'Pas de cloisonnement R&D.' },
            { id: 'AE9', label: 'Exploitation maliciel de collecte et d’exfiltration', phase: 'exploiter', pr: 4, diff: 2, predecesseurs: ['AE8', 'AE5'], finale: false, justification: '' },
            { id: 'AE10', label: 'Création et maintien d’un canal d’exfiltration via un poste Internet', phase: 'exploiter', pr: 3, diff: 1, predecesseurs: ['AE9', 'AE6'], finale: true, justification: '' },
          ],
        },
        {
          id: 'SO2', ssId: 'SS2', titre: 'Sabotage de la production via l’infogéreur', methode: 'avancee',
          expresse: { mode: 'direct', v: 2, pr: 2, diff: 2 }, correctionChaineLongue: true, sourceDeterminee: true,
          actions: [
            { id: 'AE1', label: 'Repérage des administrateurs de l’infogéreur', phase: 'connaitre', pr: 4, diff: 0, predecesseurs: [], finale: false, justification: '' },
            { id: 'AE2', label: 'Compromission d’un compte d’administration à distance', phase: 'rentrer', pr: 2, diff: 3, predecesseurs: ['AE1'], finale: false, justification: 'MFA déployé sur le VPN.' },
            { id: 'AE3', label: 'Rebond vers le réseau industriel', phase: 'trouver', pr: 2, diff: 3, predecesseurs: ['AE2'], finale: false, justification: '' },
            { id: 'AE4', label: 'Modification des consignes SCADA', phase: 'exploiter', pr: 3, diff: 3, predecesseurs: ['AE3'], finale: true, justification: '' },
          ],
        },
      ],
    },
    atelier5: {
      traitements: {
        SO1: { option: 'reduire', mesures: 'Cloisonnement réseau R&D ; bac à sable messagerie ; sensibilisation RH ; DLP en sortie.', responsable: 'RSSI', echeance: '2027-03-31', graviteResiduelle: 3, vraisemblanceResiduelle: 1 },
        SO2: { option: 'reduire', mesures: 'Bastion d’administration pour l’infogéreur ; supervision SOC du réseau industriel.', responsable: 'RSSI', echeance: '2027-06-30', graviteResiduelle: 4, vraisemblanceResiduelle: 1 },
      },
    },
  };
}
