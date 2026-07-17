import React from 'react';

export function PauseMenu({ onResume, onSettings }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60">
            <h2 className="text-3xl font-bold text-white mb-4">Paused</h2>
            <MenuButton onClick={onResume}>Resume</MenuButton>
            <MenuButton onClick={onSettings}>Settings</MenuButton>
        </div>
    );
}

function MenuButton({ onClick, children }) {
    return (
        <button
            onClick={onClick}
            className="w-48 py-2 rounded border-2 border-[hsl(319,25%,46%)] bg-white text-[hsl(319,25%,46%)] font-semibold hover:bg-[hsl(319,25%,46%)] hover:text-white transition-colors"
        >
            {children}
        </button>
    );
}