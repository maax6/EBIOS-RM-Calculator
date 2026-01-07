```
---
title: 'EBIOS RM Likelihood Calculator'
slug: 'ebios-rm-likelihood-calculator'
created: '2026-01-07T16:20:00'
status: 'Implementation Complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['HTML5', 'Modern Vanilla CSS (Glassmorphism)', 'ES6+ JavaScript', 'Mermaid.js (Visualisation)', 'jsPDF + AutoTable']
files_to_modify: ['index.html', 'styles/main.css', 'js/state.js', 'js/calculator.js', 'js/diagram.js', 'js/exportPDF.js']
code_patterns: ['State-driven UI (Observer Pattern)', 'Functional Calculation Logic', 'Atomic CSS Variables', 'SVG Path Generation']
test_patterns: ['Jest (pour le moteur de calcul)', 'Manual UI Verification']
---

# Tech-Spec: EBIOS RM Likelihood Calculator

**Created:** 2026-01-07T16:20:00

## Overview

### Problem Statement

Le calcul de la vraisemblance dans l'Atelier 4 d'EBIOS RM est souvent complexe à réaliser manuellement, surtout lorsqu'il s'agit de scénarios opérationnels multi-étapes. Les RSSI manquent d'outils visuels permettant de simuler l'impact des mesures de sécurité du socle sur un chemin d'attaque complet et d'en déduire une note de vraisemblance fiable et normée.

### Solution

Développer une application web interactive "Premium" permettant de modéliser des scénarios d'attaque à travers trois niveaux de granularité (Expresse, Standard, Avancé). L'outil propose une visualisation interactive du chemin d'attaque, calcule automatiquement la vraisemblance via une matrice de correspondance et permet d'exporter les résultats pour une intégration directe dans les rapports de sécurité.

### Scope

**In Scope:**
- Sélecteur de granularité (3 modes).
- Moteur de calcul matriciel (Probabilité x Difficulté).
- Gestion de la logique du "Maillon Faible" et des cumuls de difficulté.
- Diagramme de chemin d'attaque interactif (cliquable pour modification).
- Gestion de l'impact du socle de sécurité (Atelier 1).
- exportPDF : Export des données en format JSON (importable) et PDF (imprimable).
- UI/UX Premium : Dark mode, glassmorphism, micro-animations.

**Out of Scope:**
- Base de données persistante (stockage serveur).
- Système d'authentification utilisateur.
- Gestion d'un inventaire complet des actifs (Atelier 2).

## Context for Development

### Codebase Patterns

- **Architecture**: Structure modulaire en pur Vanilla JS (ES Modules).
- **State Management**: Objet d'état centralisé avec un système de "pub/sub" simple pour notifier les composants (Diagramme, Score, Inputs) des changements.
- **UI System**: Utilisation de `backdrop-filter: blur()`, gradients animés et variables CSS `calc()` pour une interface responsive et immersive.
- **SVG Manipulation**: Utilisation de l'API DOM SVG pour générer des connecteurs dynamiques entre les étapes de l'attaque.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `_bmad/bmm/prd.md` | PRD initial et vision |
| Image 0 | Formule technique de difficulté : `Max(Indice_Diff(AE_n), Min(Indices_Diff(AE_n-1)))` |
| Image 1 | Matrice de Vraisemblance (Combinaisons 1 à 4) |
| Image 2 | Structure type du chemin : Connaître → Rentrer → Trouver → Exploiter |

### Technical Decisions

- **Visualisation**: **Mermaid.js** pour la génération rapide de diagrammes via syntaxe texte, avec une couche d'interactivité personnalisée pour capturer les clics sur les nœuds (Actions Élémentaires).
- **Alternative (si Mermaid est trop rigide)** : Un moteur **Custom SVG** (D3.js ou Vanilla SVG) si l'on veut un contrôle total sur l'esthétique des courbes de chemin d'attaque.
- **Formule de difficulté**: `Diff(Path) = Max(Action_n, Min(Path_to_n-1))`.
- **exportPDF**: Utilisation de `jsPDF` pour le rendu PDF côté client.

## Implementation Plan

### Tasks

- [x] Task 1: Mise en place de la structure HTML et du Design System (Glassmorphism)
  - File: `index.html`, `styles/main.css`
  - Action: Créer le squelette HTML5 et définir les variables CSS pour le mode sombre et les effets de flou (backdrop-filter).
  - Notes: Inclure les conteneurs pour le diagramme Mermaid et le panneau de contrôle.

- [x] Task 2: Core State Management & Pub/Sub
  - File: `js/state.js`
  - Action: Implémenter l'objet d'état centralisé et le système de notification pour les composants UI.
  - Notes: Doit gérer le scénario par défaut (Connaître -> Rentrer -> Trouver -> Exploiter).

- [x] Task 3: Moteur de Calcul EBIOS RM (Atelier 4)
  - File: `js/calculator.js`
  - Action: Implémenter la matrice de vraisemblance 5x5 et la fonction de calcul de difficulté de chemin : `Max(Indice_Diff(AE_n), Min(Indices_Diff(AE_n-1)))`.
  - Notes: Exporter les fonctions pour tests unitaires.

- [x] Task 4: Visualisation Interactive avec Mermaid.js
  - File: `js/diagram.js`
  - Action: Générer la syntaxe Mermaid à partir de l'état, rendre le diagramme et ajouter des écouteurs de clics sur les nœuds pour permettre la saisie des notes.
  - Notes: Utiliser `mermaid.render` pour le rafraîchissement dynamique.

- [x] Task 5: Système d'Export exportPDF
  - File: `js/exportPDF.js`
  - Action: Implémenter les fonctions d'export JSON (Blob) et PDF (jsPDF + AutoTable pour le récapitulatif des notes).
  - Notes: Le PDF doit inclure le score de vraisemblance globale du scénario.

- [x] Task 6: Intégration Finale et UX Polish
  - File: `index.html`, `js/main.js`
  - Action: Lier tous les modules et ajouter les micro-animations (hover effects, transitions de score).

### Acceptance Criteria

- [x] AC 1: Calcul de Vraisemblance (Matrice)
  - Given une Action Élémentaire avec Probabilité "Significative (2)" et Difficulté "Modérée (2)", when le calcul est lancé, then le score de vraisemblance doit être "V2".
- [x] AC 2: Logique du Maillon Faible
  - Given un chemin avec une étape difficile (D3) suivie d'une étape facile (D1), when la difficulté cumulée est calculée, then le score global doit refléter la facilité de l'étape la plus simple selon la formule EBIOS.
- [x] AC 3: Interactivité du Diagramme
  - Given le diagramme affiché, when l'utilisateur clique sur une étape "Rentrer", then une interface de saisie doit apparaître pour modifier ses notes.
- [x] AC 4: Fonctionnalité exportPDF
  - Given un scénario complété, when l'utilisateur clique sur "Exporter PDF", then un fichier PDF contenant le tableau des notes et le score final doit être téléchargé.

## Additional Context

### Dependencies

- **Mermaid.js**: Pour le rendu des diagrammes de chemin d'attaque.
- **jsPDF**: Pour la génération de rapports exportPDF.
- **Lucide-Icons**: Source des icônes pour l'UI.
- **Google Fonts (Inter/Outfit)**: Pour la typographie premium.

### Testing Strategy

- **Unit Testing**: Tests Jest sur `calculator.js` pour valider les 25 cases de la matrice EBIOS.
- **Manual UI Testing**: Vérifier que le clic sur chaque nœud Mermaid ouvre bien le panneau de saisie correct.
- **Visual Testing**: Validation du rendu Glassmorphism sur Chrome/Firefox.

### Notes

- L'utilisateur final est un expert (RSSI/DSI), l'interface doit être sobre mais technologiquement valorisante.
