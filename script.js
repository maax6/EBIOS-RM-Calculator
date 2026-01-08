/**
 * EBIOS RM Tool - Logic & State Management
 * Version: 2.0 (Clean Architecture, No Modes)
 */

window.app = {
    state: {
        currentStep: 0,
        // Les 4 étapes fondamentales d'un scénario opérationnel
        steps: [
            { name: 'Connaître', prob: 2, diff: 2, socle: 0 },
            { name: 'Rentrer', prob: 2, diff: 2, socle: 0 },
            { name: 'Trouver', prob: 2, diff: 2, socle: 0 },
            { name: 'Exploiter', prob: 2, diff: 2, socle: 0 }
        ]
    },

    // Matrice EBIOS RM officielle (Ligne: P0-P4, Colonne: D0-D4)
    // Valeurs: 0=V0, 1=V1... 4=V4
    matrix: [
        [1, 1, 1, 0, 0], // P0 (Très Faible)
        [2, 2, 2, 1, 0], // P1 (Faible)
        [3, 3, 2, 2, 1], // P2 (Significative)
        [4, 3, 3, 2, 1], // P3 (Très Élevée)
        [4, 4, 3, 2, 1]  // P4 (Quasi Certaine)
    ],

    init() {
        this.renderMetricSelectors('prob', ['T. Faible', 'Faible', 'Significative', 'T. Élevée', 'Q. Certaine']);
        this.renderMetricSelectors('diff', ['Négligeable', 'Faible', 'Modérée', 'Élevée', 'T. Élevée']);
        this.renderMetricSelectors('socle', ['Nul', 'Limité', 'Important', 'Maximal']);

        // Setup Theme Toggle
        document.querySelector('.theme-toggle').onclick = () => {
            const b = document.body;
            b.dataset.theme = b.dataset.theme === 'dark' ? 'light' : 'dark';
        };

        this.render();
        this.runEBIOSChallenge(); // Auto-test logic on startup
    },

    /**
     * CORE CALCULATION ENGINE
     * Calcule le score final d'une étape (V_final)
     */
    getStepScore(p, d, s) {
        // 1. Matrice brute
        const v_raw = this.matrix[p][d];

        // 2. Application du Socle (Réduction du risque)
        if (s === 3) return v_raw > 0 ? 1 : 0; // Maximal -> Plafond V1
        if (s === 2) return Math.max(v_raw - 1, (v_raw > 0 ? 1 : 0)); // Important -> -1
        if (s === 1 && v_raw >= 3) return v_raw - 1; // Limité -> Réduit seulement les forts risques

        return v_raw; // Socle Nul ou impact insuffisant
    },

    calculateGlobal() {
        // MAILLON FAIBLE : Le scénario global vaut le score de son étape la plus "difficile" pour l'attaquant 
        // (donc le V le plus bas).
        const scores = this.state.steps.map(s => this.getStepScore(s.prob, s.diff, s.socle));
        return {
            score: Math.min(...scores),
            details: scores
        };
    },

    // --- UI RENDERING ---

    renderMetricSelectors(type, labels) {
        const container = document.getElementById(`sel-${type}`);
        container.innerHTML = labels.map((l, i) =>
            `<div class="seg-item" onclick="app.updateMetric('${type}', ${i})">${l}</div>`
        ).join('');
    },

    updateMetric(type, val) {
        this.state.steps[this.state.currentStep][type] = val;
        this.render();
    },

    setActiveStep(i) {
        this.state.currentStep = i;
        this.render();
    },

    render() {
        const s = this.state;
        const active = s.steps[s.currentStep];

        // 1. Stepper UI
        document.getElementById('stepper-ui').innerHTML = s.steps.map((step, i) => `
            <div class="step-item ${i === s.currentStep ? 'active' : ''}" onclick="app.setActiveStep(${i})">
                <div class="step-bubble">${i + 1}</div>
                <div class="step-label">${step.name}</div>
            </div>
        `).join('');

        document.getElementById('step-name').textContent = `Étape : ${active.name}`;

        // 2. Diff Description
        const diffDescs = [
            "0. Négligeable : Ressources publiques/ouvertes.",
            "1. Faible : Curiosité, script kiddie.",
            "2. Modérée : Compétences techniques standards.",
            "3. Élevée : Moyens experts, crime organisé.",
            "4. Très Élevée : Ressources étatiques, APT."
        ];
        document.getElementById('diff-desc').textContent = diffDescs[active.diff];

        // 3. Update Selectors State & Colors
        const colors = ["#2ea043", "#a8cf45", "#ffce00", "#db6d28", "#f85149"]; // V1->V5 (Vert->Rouge)

        ['prob', 'diff', 'socle'].forEach(type => {
            document.querySelectorAll(`#sel-${type} .seg-item`).forEach((item, i) => {
                const isActive = (i === active[type]);
                item.classList.toggle('active', isActive);

                // Coloration dynamique "EBIOS"
                if (isActive) {
                    let color = 'var(--accent-color)'; // Default Blue

                    if (type === 'prob') {
                        // P0=Vert ... P4=Rouge
                        color = colors[i];
                    }
                    else if (type === 'diff') {
                        // D0=Rouge (Danger) ... D4=Vert (Sécurisé)
                        color = colors[4 - i];
                    }
                    else if (type === 'socle') {
                        // Socle: Dégradé bleu
                        const blueScale = ['#233646', '#316dca', '#58a6ff', '#79c0ff'];
                        color = blueScale[i];
                    }

                    item.style.backgroundColor = color;
                    item.style.borderColor = color;
                    item.style.color = (type === 'prob' && i < 2) || (type === 'diff' && i > 2) ? '#0d1117' : '#fff'; // Contraste texte
                    item.style.boxShadow = `0 4px 15px ${color}66`;
                } else {
                    // Reset style pour les inactifs
                    item.style.backgroundColor = '';
                    item.style.borderColor = '';
                    item.style.color = '';
                    item.style.boxShadow = '';
                }
            });
        });

        // 4. Calculations & Visualization
        const stepRaw = this.matrix[active.prob][active.diff];
        const stepFinal = this.getStepScore(active.prob, active.diff, active.socle);
        const globalRes = this.calculateGlobal();

        // Update Matrix Visualization
        this.renderMatrix(active.prob, active.diff);

        // Update Calculation Flow (Side Panel)
        this.updateCalculationPanel(stepRaw, active.socle, stepFinal);

        // Global Score
        const scoreEl = document.getElementById('global-score');
        scoreEl.textContent = `V${globalRes.score}`;
        scoreEl.className = `global-score-big`;
        scoreEl.style.color = `var(--v${globalRes.score > 0 ? globalRes.score : 1})`; // Fallback color logic if needed

        this.renderSummary();
    },

    updateCalculationPanel(raw, socle, final) {
        const colors = ["#2ea043", "#a8cf45", "#ffce00", "#db6d28", "#f85149"]; // for JS usage if needed
        const socleLabels = ['Nul', 'Limité', 'Important', 'Maximal'];

        // Badges
        const rawEl = document.getElementById('calc-raw-score');
        rawEl.textContent = `V${raw}`;
        rawEl.className = `calc-badge v${raw}-cell`;

        const socleEl = document.getElementById('calc-socle-level');
        socleEl.textContent = socleLabels[socle];
        socleEl.className = `calc-badge socle`;
        socleEl.style.opacity = socle > 0 ? 1 : 0.5;

        const finalEl = document.getElementById('calc-final-score');
        finalEl.textContent = `V${final}`;
        finalEl.className = `calc-badge v${final}-cell`;

        // Pulse effect if changed
        finalEl.style.boxShadow = (raw !== final) ? `0 0 15px var(--v${final})` : 'none';

        // Justification Text Logic
        const diffLabels = ['négligeables', 'faibles', 'modérées', 'élevées', 'très élevées'];
        const probLabels = ['très faible', 'faible', 'significative', 'très élevée', 'quasi certaine'];

        let text = `Un attaquant aux ressources <strong>${diffLabels[this.state.steps[this.state.currentStep].diff]}</strong> `;
        text += `a une probabilité <strong>${probLabels[this.state.steps[this.state.currentStep].prob]}</strong> de réussite. `;

        if (socle === 0) text += "Aucun socle ne vient atténuer ce risque.";
        else if (raw === final) text += "Le socle en place est insuffisant pour baisser le niveau de vraisemblance.";
        else text += "Le niveau de socle permet de réduire la vraisemblance finale d'un ou plusieurs crans.";

        document.getElementById('calc-justification').innerHTML = text;
    },

    renderMatrix(ap, ad) {
        const container = document.getElementById('ebios-matrix');
        let h = '<div class="matrix-empty"></div>';
        // Headers D0-D4
        for (let d = 0; d <= 4; d++) h += `<div class="matrix-label-cell ${d === ad ? 'active' : ''}" style="${d === ad ? 'color:white' : ''}">D${d}</div>`;

        for (let p = 4; p >= 0; p--) {
            h += `<div class="matrix-label-cell" style="${p === ap ? 'color:white' : ''}">P${p}</div>`;
            for (let d = 0; d <= 4; d++) {
                const val = this.matrix[p][d];
                const isActive = (p === ap && d === ad);
                const isRowCol = (p === ap || d === ad);
                h += `<div class="matrix-cell v${val}-cell ${isActive ? 'active-cell' : ''} ${isRowCol ? 'row-active' : ''}">V${val}</div>`;
            }
        }
        container.innerHTML = h;
    },

    renderSummary() {
        const pColors = ["#2ea043", "#a8cf45", "#ffce00", "#db6d28", "#f85149"]; // Vert -> Rouge
        const dColors = ["#f85149", "#db6d28", "#ffce00", "#a8cf45", "#2ea043"]; // Rouge -> Vert (Inverse)
        const sColors = ['#233646', '#316dca', '#58a6ff', '#79c0ff']; // Bleu gamme

        // Affiche la liste des 4 étapes avec leur score individuel
        const container = document.getElementById('summary-visualization');
        container.innerHTML = this.state.steps.map((step, i) => {
            const score = this.getStepScore(step.prob, step.diff, step.socle);
            const isActive = i === this.state.currentStep;

            // Calc labels
            const pLabel = ['T. Faible', 'Faible', 'Signif.', 'T. Elevée', 'Q. Certaine'][step.prob];
            const dLabel = ['Néglig.', 'Faible', 'Modérée', 'Elevée', 'T. Elevée'][step.diff];
            const sLabel = ['Nul', 'Limité', 'Important', 'Maximal'][step.socle];

            return `
                <div class="summary-card ${isActive ? 'active-step-card' : ''}" 
                     onclick="app.setActiveStep(${i})" 
                     style="border-top: 4px solid var(--v${score}); position: relative; display:flex; flex-direction:column; gap:8px;">
                    
                    <!-- Header Carte -->
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; opacity:0.7;">ÉTAPE ${i + 1}</span>
                        <span style="font-weight:900; font-size:0.9rem; padding:2px 8px; border-radius:4px; background:var(--v${score}); color:${score > 2 ? '#fff' : '#0d1117'}">V${score}</span>
                    </div>

                    <!-- Titre Etape -->
                    <div style="font-size:1rem; font-weight:800; margin-bottom:4px;">${step.name}</div>
                    
                    <div style="height:1px; background:var(--border-color); width:100%; margin:4px 0;"></div>

                    <!-- Métriques Détaillées -->
                    <div style="display:grid; grid-template-columns: 1fr; gap:6px;">
                         
                         <!-- Probabilité -->
                         <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
                            <span style="color:var(--text-light)">Probabilité</span>
                            <span style="font-weight:700; color:${pColors[step.prob]}">${pLabel}</span>
                         </div>

                         <!-- Difficulté -->
                         <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
                            <span style="color:var(--text-light)">Difficulté</span>
                            <span style="font-weight:700; color:${dColors[step.diff]}">${dLabel}</span>
                         </div>

                         <!-- Socle -->
                         <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
                            <span style="color:var(--text-light)">Socle</span>
                            <span style="font-weight:700; color:${sColors[step.socle]}">${sLabel}</span>
                         </div>
                    </div>

                </div>
            `;
        }).join('');
    },

    exportJSON() {
        const b = new Blob([JSON.stringify(this.state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'ebios_rm.json'; a.click();
    },

    exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const globalInfo = this.calculateGlobal();
        doc.setFontSize(18);
        doc.text(`EBIOS RM - Score Global V${globalInfo.score}`, 20, 20);
        doc.setFontSize(12);
        let y = 40;
        this.state.steps.forEach((s, i) => {
            const score = this.getStepScore(s.prob, s.diff, s.socle);
            doc.text(`Etape ${i + 1} (${s.name}): V${score} (P${s.prob}/D${s.diff}/S${s.socle})`, 20, y);
            y += 10;
        });
        doc.save('ebios_result.pdf');
    },

    /**
     * EBIOS VALIDATION TESTS
     * Vérifie la cohérence du moteur de calcul au démarrage.
     */
    runEBIOSChallenge() {
        console.group("🛡️ EBIOS RM Logic Challenge");

        const tests = [
            { p: 4, d: 2, s: 0, expected: 3, name: "P4/D2 (Modérée) -> V3" }, // Standard
            { p: 4, d: 0, s: 0, expected: 4, name: "P4/D0 (Négligeable) -> V4 (Critique)" }, // Worst case
            { p: 0, d: 4, s: 0, expected: 0, name: "P0/D4 (Etat) -> V0 (Impossible)" }, // Best case

            // Tests Socle
            { p: 4, d: 2, s: 1, expected: 2, name: "V3 + Socle Limité -> V2 (-1)" },
            { p: 4, d: 2, s: 2, expected: 2, name: "V3 + Socle Important -> V2 (-1)" }, // Note: parfois interprété V1 selon méthode, ici engine fait -1
            { p: 4, d: 2, s: 3, expected: 1, name: "V3 + Socle Maximal -> V1 (Plafond)" },

            // Edge cases socle
            { p: 2, d: 2, s: 1, expected: 2, name: "V2 + Socle Limité -> V2 (Pas d'effet sur moyen)" },
            { p: 2, d: 2, s: 2, expected: 1, name: "V2 + Socle Important -> V1 (Effet)" }
        ];

        let passed = 0;
        tests.forEach(t => {
            const res = this.getStepScore(t.p, t.d, t.s);
            const success = res === t.expected;
            if (success) passed++;

            console.log(
                `%c${success ? '✅ PASS' : '❌ FAIL'}`,
                `color: ${success ? 'green' : 'red'}; font-weight:bold`,
                `${t.name} : Got V${res}, Expected V${t.expected}`
            );
        });

        console.log(`Résultat : ${passed}/${tests.length} tests validés.`);
        console.groupEnd();
    }
};

// Start
window.onload = () => window.app.init();
