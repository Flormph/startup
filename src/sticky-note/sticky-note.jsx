import { useRef, useState } from 'react';


const ZONES = [
    { id: 'morning', label: 'Morning', x0: 0, x1: 0.5, y0: 0, y1: 0.33, triggerTime: '09:00', type: 'time', zoneId: 1 },
    { id: 'afternoon', label: 'Afternoon', x0: 0, x1: 0.5, y0: 0.33, y1: 0.66, triggerTime: '13:00', type: 'time', zoneId: 2 },
    { id: 'evening', label: 'Evening', x0: 0, x1: 0.5, y0: 0.66, y1: 1, triggerTime: '18:00', type: 'time', zoneId: 3 },
    { id: '8hours', label: '8 Hours', x0: .5, x1: 1, y0: 0, y1: .33, triggerTime: '8hr', type: 'duration', zoneId: 4 },
    { id: '16hours', label: '16 Hours', x0: .5, x1: 1, y0: .33, y1: .66, triggerTime: '16hr', type: 'duration', zoneId: 5 },
    { id: '1day', label: '1 Day', x0: .5, x1: 1, y0: .66, y1: 1, triggerTime: '24hr', type: 'duration', zoneId: 6 },
]

function createReminder({ iconId, xPct, yPct, zoneId }) {
    const zone = ZONES.find((z) => z.zoneId === zoneId);
    return {
        id: crypto.randomUUID(),
        iconId,
        xPct,
        yPct,
        zoneId,
        fireAt: nextOccurence(zone.triggerTime, zone.type),
        placedAt: new Date(),
        text: null,
    };
}

function nextOccurence(triggerTime, type) {
    const fireAt = new Date();
    let hours, minutes;
    if (type === 'time') { // calculate next occurrence based on triggerTime as a specific time of day
        [hours, minutes] = triggerTime.split(':').map(Number); fireAt.setHours(hours, minutes, 0, 0);
        if (fireAt <= new Date()) {
            fireAt.setDate(fireAt.getDate() + 1);
        }
    } else if (type === 'duration') {  // calculate next occurrence based on triggerTime as a duration from now
        const duration = parseInt(triggerTime);
        const now = new Date();
        fireAt.setHours(now.getHours() + duration, now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    }

    return fireAt.getTime();
}

export function StickyNote() {
    const surfaceRef = useRef(null);
    const [reminders, setReminders] = useState([]);



    function setReminder(reminder) {
        setReminders((prevReminders) => [...prevReminders, reminder]);
    }

    return (
        <div className="w-full max-w-3xl mx-auto p-4 flex flex-col gap-4 items-center">
            <div ref={surfaceRef} className="relative w-full h-96 border-2 border-[hsl(319,25%,46%)] bg-[hsl(47,100%,81.6%)]">
                {/* placed reminder icons will render here, position: absolute */}
            </div>
            <div className="relative w-full h-16 border-2 border-[hsl(319,25%,46%)] bg-white flex flex-row items-center justify-center">
                <div>Icons will slide here</div>
            </div>
        </div>
    );
}