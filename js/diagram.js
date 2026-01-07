import { setActiveNode } from './state.js';

export function initDiagram() {
    mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        securityLevel: 'loose',
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' }
    });
}

export function renderDiagram(state) {
    const container = document.getElementById('mermaid-container');

    // Construction de la syntaxe Mermaid
    let syntax = 'graph LR\n';

    const nodeIds = Object.keys(state.nodes);
    nodeIds.forEach((id, index) => {
        const node = state.nodes[id];
        const isActive = state.activeNodeId === id ? 'active-node' : '';

        // On utilise des classes Mermaid pour le styling
        syntax += `  ${id}["${node.title}"]\n`;
        syntax += `  click ${id} callNodeClick\n`;

        if (index < nodeIds.length - 1) {
            const nextId = nodeIds[index + 1];
            syntax += `  ${id} --> ${nextId}\n`;
        }
    });

    // Nettoyage et rendu
    container.removeAttribute('data-processed');
    container.innerHTML = syntax;

    mermaid.contentLoaded();

    // On attache la fonction globale pour les clics Mermaid
    window.callNodeClick = function (id) {
        setActiveNode(id);
    };
}
