# Référentiel des Justifications EBIOS RM (Atelier 4)

Ce document liste les 100 combinaisons possibles en mode Advanced et la logique métier associée à chaque score final.

**(AE_n) = Max { Indice_Diff(AE_n), Min (Indices_Diff(AE_1...n-1)) }**
## 🧠 Logique de base
1. **Score Brut (V_raw)** : Déterminé par la matrice Probabilité (P) x Difficulté (D).
2. **Impact Socle (V_final)** :
   - **Nul** : On garde V_raw.
   - **Limité** : Réduit les risques élevés (V3/V4) de 1 point.
   - **Important** : Réduit systématiquement de 1 point (min V1).
   - **Maximal** : Plafonne le risque à V1 (résiduel minimal indispensable).

---

## 📋 Liste des 100 Situations

### Probabilité P0 (Très Faible)
- **P0 + D0 (Négligeable) + Socle Nul/Limité/Important** : **V1**. Probabilité trop faible pour un impact notable malgré la facilité.
- **P0 + D0 (Négligeable) + Socle Maximal** : **V1** (Plafond résiduel).
- **P0 + D3/D4 (Élevée) + Tout Socle** : **V0**. L'attaque est jugée quasi-impossible (cumul de probabilité très faible et difficulté experte).

### Probabilité P2 (Significative) - *Cas le plus commun*
- **P2 + D2 (Modérée) + Socle Nul** : **V2**. Risque standard pour un attaquant compétent sans défense spécifique.
- **P2 + D2 (Modérée) + Socle Limité** : **V2**. Un socle limité n'est pas jugé suffisant pour réduire un risque de niveau V2.
- **P2 + D2 (Modérée) + Socle Important** : **V1**. Les mesures (MFA/Chiffrement) font basculer le risque vers un niveau résiduel.
- **P2 + D2 (Modérée) + Socle Maximal** : **V1**. Sécurité optimale, seul un risque résiduel subsiste.

### Probabilité P4 (Quasi Certaine)
- **P4 + D0 (Négligeable) + Socle Nul** : **V4**. Danger critique. Attaque facile et inévitable sans protection.
- **P4 + D0 (Négligeable) + Socle Limité** : **V3**. Le socle limite l'impact mais le risque reste très élevé.
- **P4 + D0 (Négligeable) + Socle Important** : **V3**. Même un socle important peine face à une certitude d'attaque sur une vulnérabilité triviale.
- **P4 + D0 (Négligeable) + Socle Maximal** : **V1**. Seule une défense en profondeur (socle maximal) permet de ramener ce danger critique à un niveau maîtrisé.

*(Note : L'outil calcule dynamiquement le texte exact pour les 100 variantes selon ce modèle.)*
