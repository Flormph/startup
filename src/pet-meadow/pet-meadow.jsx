import React from 'react';
import './pet-meadow.css';

export function PetMeadow() {
    return (
        <main class="p-6 flex flex-col items-center gap-4">
            <h1 class="text-2xl font-bold text-[hsl(319,25%,46%)]">Pet Meadow (WIP)</h1>

            <section class="text-sm text-[hsl(319,25%,46%)]">Upon loading, web socket will backup the sticky note database</section>
            <section class="text-sm text-[hsl(319,25%,46%)]">Weather api will affect the setting</section>

            <div id="meadow-scene" class="relative w-full max-w-2xl h-96 overflow-hidden rounded-lg border-2 border-[hsl(319,25%,46%)] bg-gradient-to-b from-sky-200 to-sky-100">

                <div class="absolute bottom-0 left-0 w-full h-1/4 bg-green-300 border-t-2 border-green-500"></div>

                <img id="pet" src="axolotl.png" alt="Axolotl Pet"
                    class="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-32 h-32 select-none" />

            </div>

            <p class="text-[hsl(319,25%,46%)]">Pet menu goes here.</p>
        </main>
    );
}