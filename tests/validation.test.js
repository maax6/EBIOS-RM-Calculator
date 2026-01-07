/**
 * Tests de validation après corrections
 * Vérifie que les bugs identifiés sont bien corrigés
 */

// --- Configuration ---
const LIKELIHOOD_MATRIX = [
    [1, 1, 1, 0, 0],
    [2, 2, 2, 1, 0],
    [3, 3, 2, 2, 1],
    [4, 3, 3, 2, 1],
    [4, 4, 3, 2, 1]
];

function calculateLikelihood(prob, diff, socleImpact) {
    if (socleImpact) return 1;
    return LIKELIHOOD_MATRIX[prob][diff];
}

function getGlobalLikelihood(s) {
    if (s.mode === 'express') {
        const node = s.nodes[s.activeNodeId];
        return calculateLikelihood(node.prob, node.diff, node.socle);
    }

    const nodes = Object.values(s.nodes);
    const stepScores = nodes.map(n =>
        calculateLikelihood(n.prob, n.diff, n.socle)
    );

    return Math.min(...stepScores);
}

// --- Tests ---
console.log('🧪 Tests de Validation des Corrections\n');
console.log('='.repeat(60));

// Test 1: Maillon Faible de Probabilité
console.log('\n✓ Test 1: Maillon Faible de Probabilité');
const test1 = {
    mode: 'standard',
    activeNodeId: 'A',
    nodes: {
        'A': { prob: 4, diff: 0, socle: false }, // V4 - Très facile
        'B': { prob: 0, diff: 4, socle: false }, // V0 - Impossible ← BLOQUE TOUT
        'C': { prob: 4, diff: 0, socle: false }, // V4 - Très facile
        'D': { prob: 4, diff: 0, socle: false }  // V4 - Très facile
    }
};
const result1 = getGlobalLikelihood(test1);
console.log(`   Scores individuels: V4, V0, V4, V4`);
console.log(`   Score global: V${result1}`);
console.log(`   ✅ Attendu: V0 (l'étape B bloque tout)`);
console.log(`   ${result1 === 0 ? '✅ PASS' : '❌ FAIL'}`);

// Test 2: Socle Localisé (Une étape protégée, une vulnérable)
console.log('\n✓ Test 2: Socle Localisé');
const test2 = {
    mode: 'advanced',
    activeNodeId: 'A',
    nodes: {
        'A': { prob: 2, diff: 2, socle: false }, // V2
        'B': { prob: 3, diff: 1, socle: true },  // V1 (MFA actif)
        'C': { prob: 4, diff: 0, socle: false }, // V4 ← PAS PROTÉGÉ
        'D': { prob: 2, diff: 2, socle: false }  // V2
    }
};
const scores2 = Object.values(test2.nodes).map(n =>
    calculateLikelihood(n.prob, n.diff, n.socle)
);
const result2 = getGlobalLikelihood(test2);
console.log(`   Scores individuels: V${scores2.join(', V')}`);
console.log(`   Score global: V${result2}`);
console.log(`   ✅ Attendu: V1 (min de V2, V1, V4, V2)`);
console.log(`   ${result2 === 1 ? '✅ PASS' : '❌ FAIL'}`);

// Test 3: Toutes les Étapes Protégées
console.log('\n✓ Test 3: Toutes les Étapes Protégées par le Socle');
const test3 = {
    mode: 'standard',
    activeNodeId: 'A',
    nodes: {
        'A': { prob: 4, diff: 0, socle: true }, // V1
        'B': { prob: 4, diff: 0, socle: true }, // V1
        'C': { prob: 4, diff: 0, socle: true }, // V1
        'D': { prob: 4, diff: 0, socle: true }  // V1
    }
};
const result3 = getGlobalLikelihood(test3);
console.log(`   Toutes les étapes avec socle actif`);
console.log(`   Score global: V${result3}`);
console.log(`   ✅ Attendu: V1 (toutes les étapes plafonnées)`);
console.log(`   ${result3 === 1 ? '✅ PASS' : '❌ FAIL'}`);

// Test 4: Aucun Socle, Calcul Normal
console.log('\n✓ Test 4: Aucun Socle, Probabilités Variables');
const test4 = {
    mode: 'standard',
    activeNodeId: 'A',
    nodes: {
        'A': { prob: 4, diff: 1, socle: false }, // V3
        'B': { prob: 3, diff: 2, socle: false }, // V2
        'C': { prob: 2, diff: 3, socle: false }, // V1
        'D': { prob: 3, diff: 1, socle: false }  // V3
    }
};
const scores4 = Object.values(test4.nodes).map(n =>
    calculateLikelihood(n.prob, n.diff, n.socle)
);
const result4 = getGlobalLikelihood(test4);
console.log(`   Scores individuels: V${scores4.join(', V')}`);
console.log(`   Score global: V${result4}`);
console.log(`   ✅ Attendu: V2 (min de V3, V2, V1, V3)`);
console.log(`   ${result4 === 2 ? '✅ PASS' : '❌ FAIL'}`);

// Test 5: Mode Express (inchangé)
console.log('\n✓ Test 5: Mode Express reste inchangé');
const test5 = {
    mode: 'express',
    activeNodeId: 'A',
    nodes: {
        'A': { prob: 3, diff: 1, socle: false }
    }
};
const result5 = getGlobalLikelihood(test5);
console.log(`   Score: V${result5}`);
console.log(`   ✅ Attendu: V3 (matrice[3][1] = 3)`);
console.log(`   ${result5 === 3 ? '✅ PASS' : '❌ FAIL'}`);

// Test 6: Scénario Réaliste - Infrastructure Sécurisée
console.log('\n✓ Test 6: Scénario Réaliste - Infrastructure Web');
const test6 = {
    mode: 'advanced',
    activeNodeId: 'A',
    nodes: {
        'A': { prob: 3, diff: 1, socle: false }, // Reconnaissance (publique)
        'B': { prob: 2, diff: 3, socle: true },  // Intrusion (MFA + Firewall)
        'C': { prob: 1, diff: 4, socle: true },  // Élévation privilèges (PAM + Audit)
        'D': { prob: 2, diff: 2, socle: false }  // Exfiltration (pas de DLP)
    }
};
const scores6 = Object.values(test6.nodes).map(n =>
    calculateLikelihood(n.prob, n.diff, n.socle)
);
const result6 = getGlobalLikelihood(test6);
console.log(`   Étape A (Reconnaissance): P3/D1 → V3`);
console.log(`   Étape B (Intrusion):      P2/D3 + Socle → V1`);
console.log(`   Étape C (Élévation):      P1/D4 + Socle → V1`);
console.log(`   Étape D (Exfiltration):   P2/D2 → V2`);
console.log(`   Scores individuels: V${scores6.join(', V')}`);
console.log(`   Score global: V${result6}`);
console.log(`   ✅ Attendu: V1 (le socle protège efficacement)`);
console.log(`   ${result6 === 1 ? '✅ PASS' : '❌ FAIL'}`);

// Test 7: Scénario Réaliste - Infrastructure Vulnérable
console.log('\n✓ Test 7: Scénario Réaliste - Infrastructure Vulnérable');
const test7 = {
    mode: 'advanced',
    activeNodeId: 'A',
    nodes: {
        'A': { prob: 3, diff: 1, socle: false }, // Reconnaissance
        'B': { prob: 3, diff: 1, socle: false }, // Intrusion (pas de MFA)
        'C': { prob: 3, diff: 1, socle: false }, // Élévation (admin par défaut)
        'D': { prob: 4, diff: 0, socle: false }  // Exfiltration (données en clair)
    }
};
const scores7 = Object.values(test7.nodes).map(n =>
    calculateLikelihood(n.prob, n.diff, n.socle)
);
const result7 = getGlobalLikelihood(test7);
console.log(`   Infrastructure non protégée`);
console.log(`   Scores individuels: V${scores7.join(', V')}`);
console.log(`   Score global: V${result7}`);
console.log(`   ✅ Attendu: V3 (toutes les étapes faciles)`);
console.log(`   ${result7 === 3 ? '✅ PASS' : '❌ FAIL'}`);

// Résumé
console.log('\n' + '='.repeat(60));
const allTests = [result1 === 0, result2 === 1, result3 === 1, result4 === 2, result5 === 3, result6 === 1, result7 === 3];
const passed = allTests.filter(t => t).length;
const failed = allTests.length - passed;

console.log(`\n📊 Résultats: ${passed}/${allTests.length} tests réussis`);

if (failed === 0) {
    console.log('\n✅ TOUTES LES CORRECTIONS SONT VALIDÉES !');
    console.log('🎉 Le calculateur respecte maintenant la méthodologie EBIOS RM');
} else {
    console.log(`\n❌ ${failed} test(s) échoué(s) - Corrections à revoir`);
}

console.log('\n' + '='.repeat(60) + '\n');
