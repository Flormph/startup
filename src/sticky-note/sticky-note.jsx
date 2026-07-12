import React from 'react';
import './sticky-note.css';

export function StickyNote() {
    return (
        <main className="p-6">
            <h1 class="text-2xl font-bold text-[hsl(319,25%,46%)] mb-4">Sticky Note</h1>

            <table className="w-full border-collapse border-2 border-[hsl(319,25%,46%)]">
                <thead>
                    <tr className="bg-[#f3c3e0] text-[hsl(319,25%,46%)]">
                        <th className="border border-[hsl(319,25%,46%)] p-2 text-left">Note Title</th>
                        <th className="border border-[hsl(319,25%,46%)] p-2 text-left">Note Content</th>
                        <th className="border border-[hsl(319,25%,46%)] p-2 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="hover:bg-[#f3c3e0]/30">
                        <td className="border border-[hsl(319,25%,46%)] p-2">Sample Note</td>
                        <td className="border border-[hsl(319,25%,46%)] p-2">This is a sample note.</td>
                        <td className="border border-[hsl(319,25%,46%)] p-2 align-middle">
                            <div className="flex justify-center items-center gap-2">
                                <button aria-label="Edit element one" className="px-3 py-1 rounded bg-[hsl(319,25%,46%)] text-[antiquewhite] hover:bg-[hsl(319,25%,56%)]">Edit</button>
                                <button aria-label="Delete element one" className="px-3 py-1 rounded bg-white text-[hsl(319,25%,46%)] border-2 border-[hsl(319,25%,46%)] hover:bg-[hsl(319,25%,95%)]">Delete</button>
                            </div>
                        </td>
                    </tr>
                    <tr className="hover:bg-[#f3c3e0]/30">
                        <td className="border border-[hsl(319,25%,46%)] p-2">Another Note</td>
                        <td className="border border-[hsl(319,25%,46%)] p-2">This is another note.</td>
                        <td className="border border-[hsl(319,25%,46%)] p-2 align-middle">
                            <div className="flex justify-center items-center gap-2">
                                <button aria-label="Edit element two" className="px-3 py-1 rounded bg-[hsl(319,25%,46%)] text-[antiquewhite] hover:bg-[hsl(319,25%,56%)]">Edit</button>
                                <button aria-label="Delete element two" className="px-3 py-1 rounded bg-white text-[hsl(319,25%,46%)] border-2 border-[hsl(319,25%,46%)] hover:bg-[hsl(319,25%,95%)]">Delete</button>
                            </div>
                        </td>
                    </tr>
                    <tr className="hover:bg-[#f3c3e0]/30">
                        <td className="border border-[hsl(319,25%,46%)] p-2">Third Note</td>
                        <td className="border border-[hsl(319,25%,46%)] p-2">This is the third note.</td>
                        <td className="border border-[hsl(319,25%,46%)] p-2 align-middle">
                            <div className="flex justify-center items-center gap-2">
                                <button aria-label="Edit element three" className="px-3 py-1 rounded bg-[hsl(319,25%,46%)] text-[antiquewhite] hover:bg-[hsl(319,25%,56%)]">Edit</button>
                                <button aria-label="Delete element three" className="px-3 py-1 rounded bg-white text-[hsl(319,25%,46%)] border-2 border-[hsl(319,25%,46%)] hover:bg-[hsl(319,25%,95%)]">Delete</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </main>
    );
}