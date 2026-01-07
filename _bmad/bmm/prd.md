# PRD : EBIOS RM Likelihood Calculator (Atelier 4)

## 1. Vision du Produit
Créer un outil interactif permettant au RSSI et à la DSI d'évaluer la probabilité qu'un attaquant réussisse un scénario technique sur les biens supports (ex: vos serveurs Hodor, Picsou). Contrairement au CVSS qui note une vulnérabilité isolée, cet outil note la faisabilité d'un chemin d'attaque complet.

## 2. Objectifs de l'Atelier 4 (Rappel)
- Définir des scénarios opérationnels détaillés sur les biens supports.
- Évaluer la vraisemblance (Likelihood) de ces scénarios.
- Prendre en compte les mesures de sécurité du socle (Atelier 1) pour vérifier leur efficacité.

## 3. Fonctionnalités Principales

### A. Sélection de la Granularité (Les 3 Méthodes)
L'utilisateur doit pouvoir choisir entre trois modes de calcul :
1. **Mode Expresse** : Une seule jauge pour une cotation directe et globale de la vraisemblance.
2. **Mode Standard** : Découpage par "actions élémentaires". L'utilisateur note la probabilité de succès de chaque étape.
3. **Mode Avancé** : Pour chaque action, évaluation de la probabilité de succès ET de la difficulté technique.

### B. Paramètres de Calcul (Inputs)
- **Probabilité de succès** : De "Très faible" (0) à "Quasi-certaine" (4).
- **Difficulté technique (Mode Avancé)** : De "Négligeable" (0) à "Très élevée" (4).
- **Impact du Socle** : Case à cocher pour indiquer si une mesure (ex: MFA) bloque l'action.

### C. Visualisation du Chemin d'Attaque
Génération d'un diagramme dynamique montrant la progression (Connaître → Intruser → Trouver → Exploiter).

## 4. Spécifications du Score Final (Output)
Le résultat final est une note de Vraisemblance (V) de 1 à 4 :
- **V4 (Très élevée)** : Succès certain.
- **V3 (Élevée)** : Succès probable.
- **V2 (Significative)** : Succès susceptible.
- **V1 (Minime)** : Peu de chances de succès.

## 5. Logique de Calcul
- Utilisation d'une matrice de correspondance pour croiser probabilité et difficulté.
- Le score final est déterminé par l'étape la plus "facile" (logique du maillon faible).
