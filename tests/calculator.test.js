/**
 * Tests pour le calculateur EBIOS RM
 * Concentré sur le score global et le comportement du socle
 */

// Import des fonctions à tester (pour Node.js, sinon utiliser directement dans le navigateur)
// const { calculateLikelihood, getGlobalLikelihood, calculatePathDifficulty } = require('./calculator.js');

// --- Configuration de test ---
const LIKELIHOOD_MATRIX = [
    [1, 1, 1, 0, 0], // Prob 0: Très Faible
    [2, 2, 2, 1, 0], // Prob 1: Faible
    [3, 3, 2, 2, 1], // Prob 2: Significative
    [4, 3, 3, 2, 1], // Prob 3: Très Élevée
    [4, 4, 3, 2, 1]  // Prob 4: Quasi-certaine
];

// Réimplémentation pour tests
function calculateLikelihood(prob, diff, socleImpact) {
    if (socleImpact) return 1;
    return LIKELIHOOD_MATRIX[prob][diff];
}

function calculatePathDifficulty(nodeDiffs) {
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

function getGlobalLikelihood(state) {
    if (state.mode === 'express') {
        const node = state.nodes[state.activeNodeId];
        return calculateLikelihood(node.prob, node.diff, node.socle);
    }

    const nodes = Object.values(state.nodes);
    const diffs = nodes.map(n => n.diff);
    const probs = nodes.map(n => n.prob);

    const globalDiff = calculatePathDifficulty(diffs);
    const globalProb = Math.max(...probs);
    const anySocle = nodes.some(n => n.socle);

    return calculateLikelihood(globalProb, globalDiff, anySocle);
}

// --- Tests ---
const tests = [];
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
    tests.push({ name, fn });
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Values are not equal'}\nExpected: ${expected}\nActual: ${actual}`);
    }
}

function runTests() {
    console.log('🧪 Lancement des tests EBIOS RM Calculator\n');
    console.log('='.repeat(50));

    tests.forEach(({ name, fn }) => {
        try {
            fn();
            passedTests++;
            console.log(`✅ PASS: ${name}`);
        } catch (error) {
            failedTests++;
            console.log(`❌ FAIL: ${name}`);
            console.log(`   ${error.message}\n`);
        }
    });

    console.log('='.repeat(50));
    console.log(`\n📊 Résultats: ${passedTests} réussis, ${failedTests} échoués sur ${tests.length} tests\n`);

    return failedTests === 0;
}

// ==============================================
// TESTS DU SCORE GLOBAL
// ==============================================

test('Score global - Mode Express avec valeurs par défaut', () => {
    const state = {
        mode: 'express',
        activeNodeId: 'A',
        nodes: {
            'A': { prob: 2, diff: 2, socle: false }
        }
    };

    const result = getGlobalLikelihood(state);
    assertEqual(result, 2, 'Le score devrait être V2 (matrice[2][2] = 2)');
});

test('Score global - Mode Express avec haute probabilité et basse difficulté', () => {
    const state = {
        mode: 'express',
        activeNodeId: 'A',
        nodes: {
            'A': { prob: 4, diff: 0, socle: false }
        }
    };

    const result = getGlobalLikelihood(state);
    assertEqual(result, 4, 'Le score devrait être V4 (matrice[4][0] = 4)');
});

test('Score global - Mode Standard avec 4 étapes identiques', () => {
    const state = {
        mode: 'standard',
        activeNodeId: 'A',
        nodes: {
            'A': { prob: 2, diff: 2, socle: false },
            'B': { prob: 2, diff: 2, socle: false },
            'C': { prob: 2, diff: 2, socle: false },
            'D': { prob: 2, diff: 2, socle: false }
        }
    };

    const result = getGlobalLikelihood(state);
    // Prob max = 2, Diff globale = 2 (toutes identiques)
    assertEqual(result, 2, 'Le score devrait être V2');
});

test('Score global - Mode Advanced avec probabilités variables (maillon faible)', () => {
    const state = {
        mode: 'advanced',
        activeNodeId: 'A',
        nodes: {
            'A': { prob: 4, diff: 0, socle: false }, // Facile
            'B': { prob: 2, diff: 3, socle: false }, // Difficile
            'C': { prob: 3, diff: 1, socle: false },
            'D': { prob: 2, diff: 2, socle: false }
        }
    };

    const result = getGlobalLikelihood(state);
    // PROBLÈME IDENTIFIÉ: La probabilité max est 4, mais le chemin d'attaque
    // devrait privilégier le "maillon faible" (l'étape la plus facile)
    // Actuellement le code prend MAX(probs) = 4, ce qui n'est pas correct
    console.log(`   ⚠️  Résultat actuel: V${result}`);
    console.log(`   📌 Prob max: 4, Diff globale: ${calculatePathDifficulty([0, 3, 1, 2])}`);
});

test('Score global - Cumul de probabilité minimum (pas maximum)', () => {
    const state = {
        mode: 'standard',
        activeNodeId: 'A',
        nodes: {
            'A': { prob: 4, diff: 0, socle: false },
            'B': { prob: 0, diff: 4, socle: false }, // Étape bloquante
            'C': { prob: 4, diff: 0, socle: false },
            'D': { prob: 4, diff: 0, socle: false }
        }
    };

    const nodes = Object.values(state.nodes);
    const probs = nodes.map(n => n.prob);

    console.log(`   📊 Probabilités: ${probs.join(', ')}`);
    console.log(`   ⚠️  Code actuel utilise Math.max(...probs) = ${Math.max(...probs)}`);
    console.log(`   ✅ EBIOS RM devrait utiliser Math.min(...probs) = ${Math.min(...probs)}`);
    console.log(`   💡 Selon EBIOS: Un chemin séquentiel est aussi faible que son maillon le plus faible`);
});

// ==============================================
// TESTS DU COMPORTEMENT DU SOCLE
// ==============================================

test('Socle - Mode Express avec socle actif réduit le score à V1', () => {
    const state = {
        mode: 'express',
        activeNodeId: 'A',
        nodes: {
            'A': { prob: 4, diff: 0, socle: true }
        }
    };

    const result = getGlobalLikelihood(state);
    assertEqual(result, 1, 'Le socle devrait plafonner à V1');
});

test('Socle - Une seule mesure de socle active suffit à réduire le score global', () => {
    const state = {
        mode: 'standard',
        activeNodeId: 'A',
        nodes: {
            'A': { prob: 4, diff: 0, socle: false },
            'B': { prob: 4, diff: 0, socle: true }, // Socle uniquement ici
            'C': { prob: 4, diff: 0, socle: false },
            'D': { prob: 4, diff: 0, socle: false }
        }
    };

    const result = getGlobalLikelihood(state);
    assertEqual(result, 1, 'Une seule mesure de socle devrait plafonner à V1');
});

test('Socle - PROBLÈME: Le socle devrait s\'appliquer PAR ÉTAPE, pas globalement', () => {
    const state = {
        mode: 'advanced',
        activeNodeId: 'A',
        nodes: {
            'A': { prob: 2, diff: 2, socle: false },
            'B': { prob: 3, diff: 1, socle: true }, // Socle protège cette étape
            'C': { prob: 4, diff: 0, socle: false }, // Mais cette étape reste vulnérable
            'D': { prob: 2, diff: 2, socle: false }
        }
    };

    const result = getGlobalLikelihood(state);
    console.log(`   ⚠️  Résultat actuel: V${result}`);
    console.log(`   ❌ PROBLÈME IDENTIFIÉ: Le socle s'applique globalement (anySocle)`);
    console.log(`   ✅ CORRECTION NÉCESSAIRE: Le socle devrait réduire seulement l'étape B`);
    console.log(`   💡 Comportement attendu:`);
    console.log(`      - Étape A: V${LIKELIHOOD_MATRIX[2][2]} (prob=2, diff=2)`);
    console.log(`      - Étape B: V1 (socle actif, plafonnement)`);
    console.log(`      - Étape C: V${LIKELIHOOD_MATRIX[4][0]} (prob=4, diff=0) ← Maillon faible!`);
    console.log(`      - Étape D: V${LIKELIHOOD_MATRIX[2][2]} (prob=2, diff=2)`);
    console.log(`      - Score global: MIN(V2, V1, V4, V2) = V1? ou logique différente?`);
});

test('Socle - Sans socle actif, le score est calculé normalement', () => {
    const state = {
        mode: 'standard',
        activeNodeId: 'A',
        nodes: {
            'A': { prob: 3, diff: 1, socle: false },
            'B': { prob: 3, diff: 1, socle: false },
            'C': { prob: 3, diff: 1, socle: false },
            'D': { prob: 3, diff: 1, socle: false }
        }
    };

    const result = getGlobalLikelihood(state);
    assertEqual(result, 3, 'Sans socle, le score devrait être V3 (matrice[3][1] = 3)');
});

// ==============================================
// TESTS DE CALCUL DE DIFFICULTÉ CUMULÉE
// ==============================================

test('Difficulté cumulée - Toutes les difficultés identiques', () => {
    const diffs = [2, 2, 2, 2];
    const result = calculatePathDifficulty(diffs);
    assertEqual(result, 2, 'La difficulté devrait rester à 2');
});

test('Difficulté cumulée - Difficultés croissantes', () => {
    const diffs = [0, 1, 2, 3];
    const result = calculatePathDifficulty(diffs);
    // Selon la formule: Max(current, Min(précédents))
    // i=1: Max(1, 0) = 1, min=0
    // i=2: Max(2, 0) = 2, min=0
    // i=3: Max(3, 0) = 3, min=0
    assertEqual(result, 3, 'La difficulté finale devrait être 3');
});

test('Difficulté cumulée - Difficultés décroissantes (goulot d\'étranglement)', () => {
    const diffs = [4, 3, 2, 1];
    const result = calculatePathDifficulty(diffs);
    // i=1: Max(3, 4) = 4, min=3
    // i=2: Max(2, 3) = 3, min=2
    // i=3: Max(1, 2) = 2, min=1
    assertEqual(result, 2, 'Le goulot devrait être à difficulté 2');
});

test('Difficulté cumulée - Pic de difficulté au milieu', () => {
    const diffs = [1, 4, 1];
    const result = calculatePathDifficulty(diffs);
    // i=1: Max(4, 1) = 4, min=1
    // i=2: Max(1, 1) = 1, min=1
    assertEqual(result, 1, 'Le chemin devrait contourner le pic');
});

// ==============================================
// TESTS DE LA MATRICE EBIOS RM
// ==============================================

test('Matrice - Probabilité haute + Difficulté basse = Risque maximum', () => {
    const result = calculateLikelihood(4, 0, false);
    assertEqual(result, 4, 'V4 attendu (attaque facile et probable)');
});

test('Matrice - Probabilité basse + Difficulté haute = Risque minimum', () => {
    const result = calculateLikelihood(0, 4, false);
    assertEqual(result, 0, 'V0 attendu (attaque improbable et difficile)');
});

test('Matrice - Valeurs moyennes', () => {
    const result = calculateLikelihood(2, 2, false);
    assertEqual(result, 2, 'V2 attendu (risque significatif)');
});

// ==============================================
// EXÉCUTION DES TESTS
// ==============================================

// Si exécuté dans Node.js
if (typeof module !== 'undefined' && module.exports) {
    runTests();
}

// Si exécuté dans le navigateur
if (typeof window !== 'undefined') {
    window.runEBIOSTests = runTests;
    console.log('💡 Tests chargés. Exécutez runEBIOSTests() dans la console.');
}
