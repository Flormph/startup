import React from 'react';

export function StartMenu({ onStart, onSettings }) {
    return (
        <div className="absolute inset-0 flex flex-col justify-center items-center gap-4 bg-black/60 backdrop-blur-sm">
            <h1 className="text-4xl font-bold text-white mb-4">Ethos Carens</h1>
            <MenuButton onClick={onStart}>Start Game</MenuButton>
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