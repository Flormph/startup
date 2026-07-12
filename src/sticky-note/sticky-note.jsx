import React from 'react';
import './sticky-note.css';

export function StickyNote() {
    return (
        <main class="p-6">
            <h1 class="text-2xl font-bold text-[hsl(319,25%,46%)] mb-4">Sticky Note</h1>

            <table class="w-full border-collapse border-2 border-[hsl(319,25%,46%)]">
                <thead>
                    <tr class="bg-[#f3c3e0] text-[hsl(319,25%,46%)]">
                        <th class="border border-[hsl(319,25%,46%)] p-2 text-left">Note Title</th>
                        <th class="border border-[hsl(319,25%,46%)] p-2 text-left">Note Content</th>
                        <th class="border border-[hsl(319,25%,46%)] p-2 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="hover:bg-[#f3c3e0]/30">
                        <td class="border border-[hsl(319,25%,46%)] p-2">Sample Note</td>
                        <td class="border border-[hsl(319,25%,46%)] p-2">This is a sample note.</td>
                        <td class="border border-[hsl(319,25%,46%)] p-2 align-middle">
                            <div class="flex justify-center items-center gap-2">
                                <button aria-label="Edit element one" class="px-3 py-1 rounded bg-[hsl(319,25%,46%)] text-[antiquewhite] hover:bg-[hsl(319,25%,56%)]">Edit</button>
                                <button aria-label="Delete element one" class="px-3 py-1 rounded bg-white text-[hsl(319,25%,46%)] border-2 border-[hsl(319,25%,46%)] hover:bg-[hsl(319,25%,95%)]">Delete</button>
                            </div>
                        </td>
                    </tr>
                    <tr class="hover:bg-[#f3c3e0]/30">
                        <td class="border border-[hsl(319,25%,46%)] p-2">Another Note</td>
                        <td class="border border-[hsl(319,25%,46%)] p-2">This is another note.</td>
                        <td class="border border-[hsl(319,25%,46%)] p-2 align-middle">
                            <div class="flex justify-center items-center gap-2">
                                <button aria-label="Edit element two" class="px-3 py-1 rounded bg-[hsl(319,25%,46%)] text-[antiquewhite] hover:bg-[hsl(319,25%,56%)]">Edit</button>
                                <button aria-label="Delete element two" class="px-3 py-1 rounded bg-white text-[hsl(319,25%,46%)] border-2 border-[hsl(319,25%,46%)] hover:bg-[hsl(319,25%,95%)]">Delete</button>
                            </div>
                        </td>
                    </tr>
                    <tr class="hover:bg-[#f3c3e0]/30">
                        <td class="border border-[hsl(319,25%,46%)] p-2">Third Note</td>
                        <td class="border border-[hsl(319,25%,46%)] p-2">This is the third note.</td>
                        <td class="border border-[hsl(319,25%,46%)] p-2 align-middle">
                            <div class="flex justify-center items-center gap-2">
                                <button aria-label="Edit element three" class="px-3 py-1 rounded bg-[hsl(319,25%,46%)] text-[antiquewhite] hover:bg-[hsl(319,25%,56%)]">Edit</button>
                                <button aria-label="Delete element three" class="px-3 py-1 rounded bg-white text-[hsl(319,25%,46%)] border-2 border-[hsl(319,25%,46%)] hover:bg-[hsl(319,25%,95%)]">Delete</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </main>
    );
}