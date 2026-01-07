import { state, subscribe, updateNode, setMode, setActiveNode, notify } from './state.js';
import { getGlobalLikelihood } from './calculator.js';
import { initDiagram, renderDiagram } from './diagram.js';
import { exportJSON, exportPDF } from './exportPDF.js';

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    initDiagram();
    setupEventListeners();

    // Premier rendu
    notify();
});

// --- SUBSCRIPTION (REACTION) ---
subscribe((s) => {
    // Calcul score global
    const score = getGlobalLikelihood(s);
    s.globalLikelihood = score;

    // Update UI Elements
    updateUI(s);
    renderDiagram(s);
});

// --- UI UPDATES ---
function updateUI(s) {
    const activeNode = s.nodes[s.activeNodeId];

    // Titres
    document.getElementById('node-title').textContent = activeNode.title;
    document.getElementById('global-vraisemblance').textContent = `V${s.globalLikelihood}`;
    document.getElementById('global-vraisemblance').style.backgroundColor = getScoreColor(s.globalLikelihood);

    // Inputs
    document.getElementById('prob-range').value = activeNode.prob;
    document.getElementById('prob-label').textContent = getProbLabel(activeNode.prob);

    document.getElementById('diff-range').value = activeNode.diff;
    document.getElementById('diff-label').textContent = getDiffLabel(activeNode.diff);

    document.getElementById('socle-impact').checked = activeNode.socle;

    // Mode handling
    const advSection = document.getElementById('advanced-inputs');
    advSection.style.display = (s.mode === 'advanced') ? 'block' : 'none';

    // Buttons active state
    document.querySelectorAll('.btn-mode').forEach(btn => {
        btn.classList.toggle('active', btn.id.includes(s.mode));
    });
}

function setupEventListeners() {
    // Modes
    document.getElementById('mode-express').onclick = () => setMode('express');
    document.getElementById('mode-standard').onclick = () => setMode('standard');
    document.getElementById('mode-advanced').onclick = () => setMode('advanced');

    // Inputs
    document.getElementById('prob-range').oninput = (e) => {
        updateNode(state.activeNodeId, { prob: parseInt(e.target.value) });
    };

    document.getElementById('diff-range').oninput = (e) => {
        updateNode(state.activeNodeId, { diff: parseInt(e.target.value) });
    };

    document.getElementById('socle-impact').onchange = (e) => {
        updateNode(state.activeNodeId, { socle: e.target.checked });
    };

    // Exports
    document.getElementById('btn-export-json').onclick = () => exportJSON(state);
    document.getElementById('btn-export-pdf').onclick = () => exportPDF(state);
}

// --- HELPERS ---
function getProbLabel(val) {
    const labels = ["T. Faible", "Faible", "Significative", "T. Élevée", "Quasi-certaine"];
    return `${labels[val]} (${val})`;
}

function getDiffLabel(val) {
    const labels = ["Négligeable", "Faible", "Modérée", "Élevée", "T. Élevée"];
    return `${labels[val]} (${val})`;
}

function getScoreColor(val) {
    const colors = ["#2ea043", "#2ea043", "#d29922", "#db6d28", "#f85149"];
    return colors[val] || "#2ea043";
}
