import React, { useState } from 'react';

export function SettingsMenu({ onBack }) {
    // TODO: lift this to a persistent store (context/module-level) once
    // real audio playback exists — local state resets when Game unmounts
    const [volume, setVolume] = useState(0.5);

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60">
            <h2 className="text-3xl font-bold text-white mb-4">Settings</h2>

            <label className="flex flex-col items-center gap-2 text-white">
                Volume
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-48"
                />
            </label>

            {/* TODO: controls remapping goes here */}

            <button
                onClick={onBack}
                className="w-[50cqw] max-w-[12rem] py-[1.5cqw] text-[clamp(0.7rem,3cqw,1rem)] rounded border-2 border-[hsl(319,25%,46%)] bg-white text-[hsl(319,25%,46%)] font-semibold hover:bg-[hsl(319,25%,46%)] hover:text-white transition-colors"
            >
                Back
            </button>
        </div>
    );
}