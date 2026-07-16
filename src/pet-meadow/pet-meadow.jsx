import { useState } from 'react';

export function PetMeadow() {
    const [petName, setPetName] = useState('Jimmy');
    const [weather, setWeather] = useState('Sunny');
    const [mood, setMood] = useState('having fun');
    const [happiness, setHappiness] = useState(100);
    return (
        <main className="p-6 flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold text-[hsl(319,25%,46%)]">{petName}'s Meadow</h1>

            <div id="meadow-scene" className="relative w-full max-w-2xl h-96 overflow-hidden rounded-lg border-2 border-[hsl(319,25%,46%)] bg-gradient-to-b from-sky-300 to-sky-50">

                <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-b from-green-500 to-green-100 border-t-2 border-green-500"></div>

                <img id="pet" src="axolotl.png" alt="Axolotl Pet"
                    className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-32 h-32 select-none" />

            </div>

            <div className="bg-[#f3c3e0] border-2 border-[hsl(319,25%,46%)] rounded w-full max-w-2xl text-center flex flex-col items-start gap-4 justify-start px-4 py-2">
                <div className="bg-[antiquewhite] border-2 border-[hsl(319,25%,46%)] px-3 py-1 rounded flex flex-col">
                    <div className="text-[hsl(319,25%,46%)]">{petName} is {mood}</div>

                </div>
                <div className="bg-[antiquewhite] border-2 border-[hsl(319,25%,46%)] px-3 py-1 rounded flex flex-col">
                    <div className="text-[hsl(319,25%,46%)]">{weather} weather</div>
                </div>
                <div className="bg-[antiquewhite] border-2 border-[hsl(319,25%,46%)] px-3 py-1 rounded flex flex-col">
                    <div className="text-[hsl(319,25%,46%)]">{petName} has {happiness} happiness</div>
                </div>
            </div>
        </main>
    );
}