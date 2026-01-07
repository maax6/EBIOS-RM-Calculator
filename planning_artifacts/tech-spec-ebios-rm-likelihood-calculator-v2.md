---
title: 'EBIOS RM Likelihood Calculator v2'
slug: 'ebios-rm-likelihood-calculator-v2'
created: '2026-01-07T17:05:00'
status: 'planning'
stepsCompleted: [1]
tech_stack: ['HTML5', 'Modern Vanilla CSS (Glassmorphism)', 'ES6+ JavaScript', 'jsPDF']
files_to_modify: ['index.html']
code_patterns: ['CVSS-style Button Groups', 'State-driven UI', 'EBIOS RM Matrix Logic']
---

# Tech-Spec: EBIOS RM Likelihood Calculator v2 (CVSS Style)

## 1. Overview
### Problème
L'interface précédente était trop générique (sliders) et ne permettait pas de distinguer efficacement les modes Express, Standard et Advanced. La gestion du "socle" était trop binaire.
### Solution
Refonte complète de l'UI pour adopter un style **CVSS Calculator**. 
- Remplacement des sliders par des **groupes de boutons** cliquables.
- Suppression de Mermaid.js pour privilégier un **système par étapes (tabs/stepper)**.
- Intégration fine des métriques (Probabilité, Difficulté, Socle) selon le mode choisi.

## 2. Context for Development
### Modes de Calcul
1. **EXPRESS** : Une seule évaluation globale du scénario.
2. **STANDARD** : Évaluation par étapes (4 étapes par défaut), bouton de Probabilité uniquement par étape.
3. **ADVANCED** : Évaluation par étapes, boutons de Probabilité ET de Difficulté technique par étape.

### Logique du Socle
Le socle n'est plus une case à cocher pour V1/V2 mais une métrique d'efficacité :
- [Aucune] : Pas d'impact sur le score.
- [Efficace] : Réduit la probabilité (ou plafonne la vraisemblance à 1 selon EBIOS RM).

## 3. Implementation Plan (Tasks)

- [ ] **Task 1: Grid Layout & Button Groups CSS**
  - Créer le design système pour les groupes de boutons (boutons alignés, état actif bleu foncé/cyan).
  - Mise en page en blocs structurés (Metrics Containers).
- [ ] **Task 2: Stepper UI (Navigation par Étapes)**
  - Créer une barre de progression/navigation cliquable pour passer de Connaître -> Rentrer -> Trouver -> Exploiter.
  - Masquer/Afficher les métriques correspondantes à l'étape active.
- [ ] **Task 3: Refactorisation du State & Logic**
  - Gérer les 3 modes avec des sets de métriques dynamiques.
  - Implémenter la matrice EBIOS RM sur la base des sélections de boutons.
- [ ] **Task 4: Template de rendu dynamique**
  - Le HTML doit générer les groupes de boutons en fonction du mode (DRY).

## 4. Acceptance Criteria
- [ ] Cliquer sur un bouton [2] met à jour instantanément le score global.
- [ ] En mode Express, il n'y a qu'une seule étape visible.
- [ ] En mode Advanced, chaque étape possède deux lignes de boutons (Probabilité et Difficulté).
- [ ] L'export PDF contient le détail de chaque étape et le score final.
