import React from 'react';

export function PetMeadow() {
    return (
        <main className="p-6 flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold text-[hsl(319,25%,46%)]">Pet Meadow (WIP)</h1>

            <section className="text-sm text-[hsl(319,25%,46%)]">Upon loading, web socket will backup the sticky note database</section>
            <section className="text-sm text-[hsl(319,25%,46%)]">Weather api will affect the setting</section>

            <div id="meadow-scene" className="relative w-full max-w-2xl h-96 overflow-hidden rounded-lg border-2 border-[hsl(319,25%,46%)] bg-gradient-to-b from-sky-200 to-sky-100">

                <div className="absolute bottom-0 left-0 w-full h-1/4 bg-green-300 border-t-2 border-green-500"></div>

                <img id="pet" src="axolotl.png" alt="Axolotl Pet"
                    className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-32 h-32 select-none" />

            </div>

            <p className="text-[hsl(319,25%,46%)]">Pet menu goes here.</p>
        </main>
    );
}