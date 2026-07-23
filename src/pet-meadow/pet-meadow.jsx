import { useState, useEffect } from 'react';
import { useAuthedFetch } from '../auth/auth.jsx';


export function PetMeadow() {
    const [pet, setPet] = useState(null); // null while loading
    const [weather, setWeather] = useState('Sunny'); // Default weather state

    // get weather from weatherstack API
    function fetchWeather() {
        const authedFetch = useAuthedFetch();
        authedFetch('/api/weather')
            .then(response => response.json())
            .then(data => {
                if (data && data.description) {
                    setWeather(data.description);
                }
            })
            .catch((err) => console.error('Error fetching weather data:', err));
    }

    useEffect(() => {
        const authedFetch = useAuthedFetch();
        async function loadPet() {
            let res = await authedFetch('/api/pet');

            if (res.status === 404) {
                // No pet stats found for user, create a new pet
                res = await authedFetch('/api/pet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ petName: 'Jimmy' }),
                });
            }

            if (res.ok) {
                const data = await res.json();
                setPet(data);
            }
        }

        loadPet();
        fetchWeather();
    }, []);

    if (!pet) {
        return <main className="p-6 text-center text-[hsl(319,25%,46%)]">Loading meadow...</main>;
    }

    function getMoodLabel(happiness) {
        if (happiness >= 80) return 'joyful';
        if (happiness >= 50) return 'content';
        if (happiness >= 25) return 'a little down';
        return 'miserable';

    }

    function classifyWeather(description) {
        const d = description.toLowerCase();
        if (d.includes('rain') || d.includes('drizzle')) return 'rainy';
        if (d.includes('cloud') || d.includes('overcast')) return 'cloudy';
        return 'sunny';
    }

    function getExcitementLabel(excitement) {
        if (excitement >= 80) return 'having fun';
        if (excitement >= 50) return 'getting bored';
        if (excitement >= 25) return 'wallowing in monotony';
        return 'questioning his friendship with you';
    }

    function getSceneClasses(category) {
        switch (category) {
            case 'rainy':
                return 'bg-gradient-to-b from-slate-400 to-slate-200';
            case 'cloudy':
                return 'bg-gradient-to-b from-slate-300 to-sky-100';
            default:
                return 'bg-gradient-to-b from-sky-300 to-sky-50';
        }
    }
    function StatBar({ label, value, max = 100, color }) {
        const pct = Math.max(0, Math.min(100, (value / max) * 100));
        return (
            <div className="w-full">
                <div className="flex justify-between text-xs text-[hsl(319,25%,46%)] mb-1">
                    <span>{label}</span>
                    <span>{value}/{max}</span>
                </div>
                <div className="w-full h-3 bg-white border border-[hsl(319,25%,46%)] rounded overflow-hidden">
                    <div
                        className="h-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                </div>
            </div>
        );
    }

    return (
        <main className="p-6 flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold text-[hsl(319,25%,46%)]">{pet.petName}'s Meadow</h1>

            <div id="meadow-scene" className={`relative w-full max-w-2xl h-96 overflow-hidden rounded-lg border-2 border-[hsl(319,25%,46%)] ${getSceneClasses(classifyWeather(weather))}`}>
                <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-b from-green-500 to-green-100 border-t-2 border-green-500"></div>

                <img id="pet" src="axolotl.png" alt="Axolotl Pet"
                    className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-32 h-32 select-none" />

            </div>

            <div className="bg-[#f3c3e0] border-2 border-[hsl(319,25%,46%)] rounded max-w-2xl text-center flex flex-row items-start gap-4 justify-center px-4 py-2">
                <div className="bg-[antiquewhite] border-2 border-[hsl(319,25%,46%)] px-3 py-1 rounded flex flex-col">
                    <div className="text-[hsl(319,25%,46%)]">{pet.petName} is {getExcitementLabel(pet.excitement)}</div>
                    <div>
                        <StatBar label="Excitement" value={pet.excitement} color="hsl(319,25%,46%)" />
                    </div>
                </div>

                <div className="bg-[antiquewhite] border-2 border-[hsl(319,25%,46%)] px-3 py-1 rounded flex flex-col">
                    <div className="text-[hsl(319,25%,46%)]">{pet.petName} is {getMoodLabel(pet.happiness)}</div>
                    <div>
                        <StatBar label="Happiness" value={pet.happiness} color="hsl(319,25%,46%)" />
                    </div>
                </div>
                <div className="bg-[antiquewhite] border-2 border-[hsl(319,25%,46%)] px-3 py-1 rounded flex flex-col">
                    <div className="text-[hsl(319,25%,46%)]">{classifyWeather(weather)} weather</div>
                </div>
            </div>
        </main>
    );
}