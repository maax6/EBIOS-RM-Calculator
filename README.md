# Calculateur de Vraisemblance EBIOS Risk Management

## 🎯 Utilité du projet
Ce projet est un outil interactif conçu pour les experts en cybersécurité et les Risk Managers. Il permet de calculer et de visualiser rapidement la **vraisemblance des scénarios d'attaque** en suivant strictement la méthodologie **EBIOS RM (Atelier 4)** de l'ANSSI.

L'objectif est de transformer une évaluation technique complexe en un tableau de bord visuel et compréhensible, facilitant ainsi la prise de décision et la communication lors des analyses de risques.

## 🚀 Fonctionnalités clés
- **Trois modes d'évaluation** :
  - **Express** : Évaluation globale rapide du scénario.
  - **Standard** : Évaluation étape par étape (Probabilité uniquement).
  - **Avancée** : Évaluation complète intégrant la difficulté technique et la formule de cumul officielle.
- **Matrice de Heatmap dynamique** : Visualisation en temps réel de la position du risque sur la matrice officielle 5x5.
- **Formule de cumul ANSSI** : Implémentation exacte de la règle du "maillon faible" (Max/Min) pour les scénarios séquentiels.
- **Compte-rendu Visuel** : Graphique d'évolution de la vraisemblance et cartes récapitulatives colorées par niveau de risque.
- **Intégration du Socle** : Prise en compte de l'efficacité des mesures de sécurité existantes.

## 📖 Comment l'utiliser ?
1. **Choisir le mode** : Sélectionnez "Express", "Standard" ou "Advanced" selon la précision souhaitée.
2. **Évaluer les étapes** : Pour chaque étape du scénario (Connaître, Rentrer, Trouver, Exploiter), choisissez le niveau de Probabilité, de Difficulté Technique et l'Efficacité du Socle.
3. **Analyser le résultat** :
   - Le score global **V1 à V4** s'affiche instantanément.
   - La **Matrice** surligne la case correspondante pour justifier la cotation.
   - Le **Graphique** en bas de page montre à quel moment l'attaquant rencontre le plus de résistance.

---
*Outil développé pour simplifier l'application de la méthode EBIOS RM au quotidien.*

