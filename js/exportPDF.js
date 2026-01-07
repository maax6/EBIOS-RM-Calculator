export function exportJSON(state) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ebios-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

export function exportPDF(state) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("Rapport de Vraisemblance EBIOS RM", 20, 20);

    doc.setFontSize(14);
    doc.text(`Projet: ${state.mode.toUpperCase()}`, 20, 35);
    doc.text(`Score de Vraisemblance Globale: V${state.globalLikelihood}`, 20, 45);

    let y = 60;
    Object.keys(state.nodes).forEach(id => {
        const node = state.nodes[id];
        doc.setFontSize(12);
        doc.text(`${node.title}: Probabilité ${node.prob}, Difficulté ${node.diff}, Socle: ${node.socle ? 'OUI' : 'NON'}`, 25, y);
        y += 10;
    });

    doc.save(`ebios-report-${Date.now()}.pdf`);
}
