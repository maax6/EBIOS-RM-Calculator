/**
 * Matrice de vraisemblance EBIOS RM
 * Lignes: Probabilité de succès (0 à 4)
 * Colonnes: Difficulté technique (0 à 4)
 */
const LIKELIHOOD_MATRIX = [
    [1, 1, 1, 0, 0], // Prob 0: Très Faible
    [2, 2, 2, 1, 0], // Prob 1: Faible
    [3, 3, 2, 2, 1], // Prob 2: Significative
    [4, 3, 3, 2, 1], // Prob 3: Très Élevée
    [4, 4, 3, 2, 1]  // Prob 4: Quasi-certaine
];

/**
 * Calcul de la difficulté cumulée selon la formule EBIOS
 * Diff(n) = Max( Diff(n), Min(Diff(1..n-1)) )
 */
export function calculatePathDifficulty(nodeDiffs) {
    if (nodeDiffs.length === 0) return 0;
    if (nodeDiffs.length === 1) return nodeDiffs[0];

    let runningMin = nodeDiffs[0];
    let currentPathDiff = nodeDiffs[0];

    for (let i = 1; i < nodeDiffs.length; i++) {
        const currentDiff = nodeDiffs[i];
        currentPathDiff = Math.max(currentDiff, runningMin);
        runningMin = Math.min(runningMin, currentDiff);
    }

    return currentPathDiff;
}

export function calculateLikelihood(prob, diff, socleImpact) {
    if (socleImpact) {
        // Un socle efficace réduit drastiquement la vraisemblance
        // On peut simuler cela par une augmentation de la difficulté ou une baisse de proba
        // Ici, on plafonne à 1 si le socle est OK
        return 1;
    }

    // Accès matrice
    const score = LIKELIHOOD_MATRIX[prob][diff];
    return score;
}

export function getGlobalLikelihood(state) {
    if (state.mode === 'express') {
        const node = state.nodes[state.activeNodeId];
        return calculateLikelihood(node.prob, node.diff, node.socle);
    }

    // Pour Standard/Advanced, on calcule le chemin
    const diffs = Object.values(state.nodes).map(n => n.diff);
    const probs = Object.values(state.nodes).map(n => n.prob);

    // Difficulté globale du maillon faible
    const globalDiff = calculatePathDifficulty(diffs);

    // Probabilité globale (pire cas)
    const globalProb = Math.max(...probs);

    // Vérification socle (si AU MOINS une mesure bloque, impact global)
    const anySocle = Object.values(state.nodes).some(n => n.socle);

    return calculateLikelihood(globalProb, globalDiff, anySocle);
}
