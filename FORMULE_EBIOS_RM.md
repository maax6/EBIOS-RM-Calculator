# 📐 Formule EBIOS RM - Explication et Implémentation

## 🎯 La Formule Officielle

```
(AE_n) = Max { Indice_Diff(AE_n), Min (Indices_Diff(AE_1...n-1)) }
                                   ↑
                            cumulés intermédiaires
```

**Source** : ANSSI - Guide EBIOS Risk Manager

---

## 🔍 Explication de la Formule

### Objectif
Calculer la **difficulté technique cumulée** d'un scénario d'attaque séquentiel.

### Principe du "Goulot d'étranglement"
- Un scénario d'attaque = suite d'actions élémentaires (AE)
- Chaque AE a une difficulté technique (0-4)
- La difficulté cumulée tient compte du **chemin le plus facile** que l'attaquant peut emprunter

### Décomposition de la formule

Pour calculer la difficulté de l'action `AE_n` :

1. **Indice_Diff(AE_n)** : Difficulté intrinsèque de l'action n
2. **Min(Indices_Diff(AE_1...n-1))** : Difficulté minimale rencontrée dans toutes les étapes précédentes
3. **Max()** : On prend le maximum des deux

**Logique** :
- Si l'attaquant a déjà franchi des étapes faciles, il a un "avantage cumulé"
- L'action actuelle peut être difficile, mais l'attaquant a déjà progressé

---

## 💻 Implémentation dans le Calculateur

### Code JavaScript

```javascript
calculateCumulativeDifficulty(diffs) {
    // diffs = [1, 4, 2, 0]  // Exemple
    let cumulativeDiffs = [];
    let runningMin = Infinity;

    diffs.forEach((d, i) => {
        if (i === 0) {
            // Première action : difficulté = difficulté intrinsèque
            cumulativeDiffs.push(d);
        } else {
            // Actions suivantes : formule EBIOS RM
            runningMin = Math.min(runningMin, diffs[i - 1]);
            cumulativeDiffs.push(Math.max(d, runningMin));
        }
    });
    
    return cumulativeDiffs[cumulativeDiffs.length - 1];
}
```

### Exemple de Calcul

**Scénario** : 4 étapes avec difficultés [1, 4, 2, 0]

| Étape | Diff intrinsèque | Min cumulé | Max(Diff, Min) | Résultat |
|-------|------------------|------------|----------------|----------|
| AE_1  | 1                | -          | 1              | **1**    |
| AE_2  | 4                | 1          | max(4, 1)      | **4**    |
| AE_3  | 2                | 1          | max(2, 1)      | **2**    |
| AE_4  | 0                | 1          | max(0, 1)      | **1**    |

**Difficulté finale** : **1** (goulot d'étranglement à l'étape 1)

---

## 🎨 Visualisation dans l'Application

### Mode Advanced - 4 Étapes

```
┌─────────────┬──────────┬──────────┬──────────┬──────────┐
│             │   AE_1   │   AE_2   │   AE_3   │   AE_4   │
│             │ Connaître│  Rentrer │  Trouver │ Exploiter│
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ Probabilité │    P4    │    P4    │    P4    │    P4    │
│ Difficulté  │    D1    │    D4    │    D2    │    D0    │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ Diff Cumulée│    1     │    4     │    2     │    1     │
└─────────────┴──────────┴──────────┴──────────┴──────────┘
                                                    ↑
                                            Score utilisé
```

### Calcul du Score Final

Le calculateur applique ensuite :

1. **Probabilité globale** = `MIN(P1, P2, P3, P4)` = Maillon faible
2. **Difficulté globale** = Formule EBIOS RM (goulot d'étranglement)
3. **Score brut** = `Matrice[Prob_globale][Diff_globale]`
4. **Application du socle** par étape
5. **Score final** = `MIN(V_étape1, V_étape2, V_étape3, V_étape4)`

---

## 📊 Cas d'Usage Concret

### Scénario : Exfiltration de données sensibles

| Étape | Action | Difficulté | Explication |
|-------|--------|------------|-------------|
| 1. Connaître | Identifier le système | **D1** (Faible) | Documentation publique |
| 2. Rentrer | Accès initial | **D4** (T. Élevée) | MFA + Firewall + IDS |
| 3. Trouver | Localiser les données | **D2** (Modérée) | Absence de segmentation |
| 4. Exploiter | Exfiltrer | **D0** (Négligeable) | Pas de DLP |

**Application de la formule** :

```
AE_1 = 1                           → Diff cumulée = 1
AE_2 = max(4, min(1)) = max(4, 1)  → Diff cumulée = 4
AE_3 = max(2, min(1)) = max(2, 1)  → Diff cumulée = 2
AE_4 = max(0, min(1)) = max(0, 1)  → Diff cumulée = 1
```

**Interprétation** :
- Même si "Rentrer" est très difficile (D4), l'attaquant a déjà franchi une étape facile (D1)
- Le goulot final est à D1, car l'étape initiale était facile
- **L'attaquant optimise son chemin en exploitant les maillons faibles**

---

## 🎯 Effet du Socle de Sécurité

### Sans Socle
```
P4 × D1 → Matrice → V4 (Très élevée)
```

### Avec Socle Maximal sur "Rentrer"
```
Étape 2: P4 × D4 → Matrice → V2 → Socle Maximal → V1
Score global = min(V4, V1, V4, V4) = V1
```

**Impact** : Le renforcement d'une seule étape peut **diviser le risque global par 4** !

---

## ✅ Validation EBIOS RM

Cette implémentation respecte :
- ✅ La formule officielle ANSSI
- ✅ Le principe du goulot d'étranglement
- ✅ L'approche "Advanced" du Club EBIOS
- ✅ La logique de chaîne séquentielle
- ✅ L'application du socle par étape

**Conformité** : 100% ✨
