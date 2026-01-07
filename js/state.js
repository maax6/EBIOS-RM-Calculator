export const state = {
    mode: 'express', // express, standard, advanced
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

export function subscribe(callback) {
    state.listeners.push(callback);
}

export function notify() {
    state.listeners.forEach(cb => cb(state));
}

export function updateNode(id, data) {
    state.nodes[id] = { ...state.nodes[id], ...data };
    notify();
}

export function setMode(mode) {
    state.mode = mode;
    notify();
}

export function setActiveNode(id) {
    state.activeNodeId = id;
    notify();
}
