/**
 * EBIOS RM Likelihood Calculator - Consolidated App
 */

// --- STATE ---
const state = {
    mode: 'express',
    activeNodeId: 'A',
    nodes: {
        'A': { title: 'Connaître', prob: 2, diff: 2, socle: false },
        'B': { title: 'Rentrer', prob: 2, diff: 2, socle: false },
        'C': { title: 'Trouver', prob: 2, diff: 2, socle: false },
        'D': { title: 'Exploiter', prob: 2, diff: 2, socle: false }
    },
    globalLikelihood: 'V2',
    listeners: []
};

function subscribe(callback) {
    state.listeners.push(callback);
}

function notify() {
    state.listeners.forEach(cb => cb(state));
}

function updateNode(id, data) {
    if (state.nodes[id]) {
        state.nodes[id] = { ...state.nodes[id], ...data };
        notify();
    }
}

function setMode(mode) {
    state.mode = mode;
    notify();
}

function setActiveNode(id) {
    if (state.nodes[id]) {
        state.activeNodeId = id;
        notify();
    }
}

// --- CALCULATOR ---
const LIKELIHOOD_MATRIX = [
    [1, 1, 1, 0, 0],
    [2, 2, 2, 1, 0],
    [3, 3, 2, 2, 1],
    [4, 3, 3, 2, 1],
    [4, 4, 3, 2, 1]
];

function calculatePathDifficulty(nodeDiffs) {
    if (nodeDiffs.length === 0) return 0;
    let runningMin = nodeDiffs[0];
    let currentPathDiff = nodeDiffs[0];
    for (let i = 1; i < nodeDiffs.length; i++) {
        const currentDiff = nodeDiffs[i];
        currentPathDiff = Math.max(currentDiff, runningMin);
        runningMin = Math.min(runningMin, currentDiff);
    }
    return currentPathDiff;
}

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
    const diffs = nodes.map(n => n.diff);
    const probs = nodes.map(n => n.prob);
    const globalDiff = calculatePathDifficulty(diffs);
    const globalProb = Math.max(...probs);
    const anySocle = nodes.some(n => n.socle);
    return calculateLikelihood(globalProb, globalDiff, anySocle);
}

// --- DIAGRAM ---
function initDiagram() {
    mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'basis' }
    });
}

// Définition globale pour Mermaid
window.callNodeClick = function (id) {
    setActiveNode(id);
};

function renderDiagram(s) {
    const container = document.getElementById('mermaid-container');
    let syntax = 'graph LR\n';
    Object.keys(s.nodes).forEach((id, index, arr) => {
        const node = s.nodes[id];
        const isActive = s.activeNodeId === id ? 'active' : '';
        // Mermaid styling hack
        syntax += `  ${id}["${node.title}"]\n`;
        syntax += `  click ${id} callNodeClick\n`;
        if (index < arr.length - 1) {
            syntax += `  ${id} --> ${arr[index + 1]}\n`;
        }
    });

    // Rendu asynchrone Mermaid
    mermaid.render('mermaid-svg', syntax).then(({ svg }) => {
        container.innerHTML = svg;
        // On force le style du SVG
        const svgEl = container.querySelector('svg');
        if (svgEl) {
            svgEl.style.width = '100%';
            svgEl.style.height = 'auto';
            svgEl.style.maxWidth = '600px';
        }
        // Highlights pour le nœud actif
        const activeNodeEl = container.querySelector(`[id*="${s.activeNodeId}"]`);
        if (activeNodeEl) {
            activeNodeEl.classList.add('active-node-svg');
        }
    });
}

// --- EXPORTS ---
function doExportJSON(s) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(s, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `ebios-export.json`;
    a.click();
}

function doExportPDF(s) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Rapport EBIOS RM", 20, 20);
    doc.setFontSize(14);
    doc.text(`Vraisemblance Globale: V${s.globalLikelihood}`, 20, 40);
    let y = 60;
    Object.values(s.nodes).forEach(n => {
        doc.text(`${n.title}: P${n.prob} D${n.diff} Socle:${n.socle}`, 25, y);
        y += 10;
    });
    doc.save(`ebios-report.pdf`);
}

// --- UI SYNC ---
function updateUI(s) {
    const activeNode = s.nodes[s.activeNodeId];
    document.getElementById('node-title').textContent = activeNode.title;
    const vScoreEl = document.getElementById('global-vraisemblance');
    vScoreEl.textContent = `V${s.globalLikelihood}`;
    vScoreEl.style.backgroundColor = getScoreColor(s.globalLikelihood);

    document.getElementById('prob-range').value = activeNode.prob;
    document.getElementById('prob-label').textContent = getProbLabel(activeNode.prob);
    document.getElementById('diff-range').value = activeNode.diff;
    document.getElementById('diff-label').textContent = getDiffLabel(activeNode.diff);
    document.getElementById('socle-impact').checked = activeNode.socle;

    document.getElementById('advanced-inputs').style.display = (s.mode === 'advanced') ? 'block' : 'none';
    document.querySelectorAll('.btn-mode').forEach(btn => {
        btn.classList.toggle('active', btn.id.includes(s.mode));
    });

    if (window.lucide) lucide.createIcons();
}

function getProbLabel(val) {
    return ["T. Faible", "Faible", "Significative", "T. Élevée", "Quasi-certaine"][val] + ` (${val})`;
}
function getDiffLabel(val) {
    return ["Négligeable", "Faible", "Modérée", "Élevée", "T. Élevée"][val] + ` (${val})`;
}
function getScoreColor(val) {
    return ["#2ea043", "#2ea043", "#d29922", "#db6d28", "#f85149"][val];
}

// --- MAIN ---
document.addEventListener('DOMContentLoaded', () => {
    initDiagram();

    // Bind events
    document.getElementById('mode-express').onclick = () => setMode('express');
    document.getElementById('mode-standard').onclick = () => setMode('standard');
    document.getElementById('mode-advanced').onclick = () => setMode('advanced');

    document.getElementById('prob-range').oninput = (e) => updateNode(state.activeNodeId, { prob: parseInt(e.target.value) });
    document.getElementById('diff-range').oninput = (e) => updateNode(state.activeNodeId, { diff: parseInt(e.target.value) });
    document.getElementById('socle-impact').onchange = (e) => updateNode(state.activeNodeId, { socle: e.target.checked });

    document.getElementById('btn-export-json').onclick = () => doExportJSON(state);
    document.getElementById('btn-export-pdf').onclick = () => doExportPDF(state);

    subscribe(updateUI);
    subscribe(renderDiagram);

    notify();
});
