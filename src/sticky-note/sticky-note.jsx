import { useRef, useState, useEffect } from 'react';
import { RouteGuard } from '../route-guard/route-guard.jsx';


const ZONES = [
    { zoneId: 'morning', label: 'Morning', x0: 0, x1: 0.5, y0: 0, y1: 0.33, triggerTime: '09:00', type: 'time' },
    { zoneId: 'afternoon', label: 'Afternoon', x0: 0, x1: 0.5, y0: 0.33, y1: 0.66, triggerTime: '13:00', type: 'time' },
    { zoneId: 'evening', label: 'Evening', x0: 0, x1: 0.5, y0: 0.66, y1: 1, triggerTime: '18:00', type: 'time' },
    { zoneId: '8hours', label: '8 Hours', x0: .5, x1: 1, y0: 0, y1: .33, triggerTime: '8hr', type: 'duration' },
    { zoneId: '16hours', label: '16 Hours', x0: .5, x1: 1, y0: .33, y1: .66, triggerTime: '16hr', type: 'duration' },
    { zoneId: '1day', label: '1 Day', x0: .5, x1: 1, y0: .66, y1: 1, triggerTime: '24hr', type: 'duration' },
]

const ICONS = [
    { iconId: 'email', emoji: '📧', label: 'Email' },
    { iconId: 'call', emoji: '📞', label: 'Call' },
    { iconId: 'laundry', emoji: '👕', label: 'Laundry' },
    { iconId: 'doctor', emoji: '👩‍⚕️', label: 'Doctor' },
    { iconId: 'shopping', emoji: '🛒', label: 'Shopping' },
    { iconId: 'homework', emoji: '📚', label: 'Homework' },
    { iconId: 'family', emoji: '👨‍👩‍👧‍👦', label: 'Family' },
    { iconId: 'documents', emoji: '📄', label: 'Documents' },
];

function getZoneIdFromPosition(xPct, yPct) {
    const zone = ZONES.find((z) => xPct >= z.x0 && xPct <= z.x1 && yPct >= z.y0 && yPct <= z.y1);
    return zone ? zone.zoneId : null;
}

function createReminder({ iconId, xPct, yPct }) {
    const zoneId = getZoneIdFromPosition(xPct, yPct);
    if (!zoneId) {
        throw new Error('Icon placed outside of defined zones');
    }
    const zone = ZONES.find((z) => z.zoneId === zoneId);
    return {
        id: crypto.randomUUID(),
        zoneId,
        iconId: iconId,
        xPct,
        yPct,
        fireAt: nextOccurence(zone.triggerTime, zone.type),
        placedAt: Date.now(),
        text: null,
        notified: false,
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

function useDragSurface(zones) {
    const ghostRef = useRef(null);
    const canvasRef = useRef(null);
    const [iconBeingDragged, setIconBeingDragged] = useState(null);

    function createGhost(icon, pointerEvent) {
        const ghost = document.createElement('div');
        ghost.textContent = icon.emoji;
        ghost.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 1000;
        font-size: 2rem;
        transform: translate(-50%, -50%);
        left: ${pointerEvent.clientX}px;
        top: ${pointerEvent.clientY}px;
    `;
        document.body.appendChild(ghost);
        ghostRef.current = ghost;
    }

    function moveGhost(pointerEvent) {
        if (!ghostRef.current) return;
        ghostRef.current.style.left = `${pointerEvent.clientX}px`;
        ghostRef.current.style.top = `${pointerEvent.clientY}px`;
    }

    function removeGhost() {
        ghostRef.current?.remove();
        ghostRef.current = null;
    }

    function handleDragStart(iconId, pointerEvent) {
        setIconBeingDragged(iconId);
        const icon = ICONS.find((i) => i.iconId === iconId);
        if (icon) {
            createGhost(icon, pointerEvent);
        }
    }

    function handleDrag(iconId, pointerEvent) {
        moveGhost(pointerEvent);
    }

    function handleDragEnd(iconId, pointerEvent, onReminderCreated) {
        removeGhost();
        setIconBeingDragged(null);
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const inBounds =
            pointerEvent.clientX >= rect.left && pointerEvent.clientX <= rect.right &&
            pointerEvent.clientY >= rect.top && pointerEvent.clientY <= rect.bottom;
        if (!inBounds) return; // outside of note, don't compute

        const xPct = (pointerEvent.clientX - rect.left) / rect.width;
        const yPct = (pointerEvent.clientY - rect.top) / rect.height;
        if (!getZoneIdFromPosition(xPct, yPct)) return; // outside of defined zones

        return onReminderCreated(createReminder({ iconId, xPct, yPct }));
    }

    return { canvasRef, iconBeingDragged, handleDragStart, handleDrag, handleDragEnd };

}

export function StickyNote() {
    const [reminders, setReminders] = useState([]);
    const { canvasRef, iconBeingDragged, handleDragStart, handleDrag, handleDragEnd } = useDragSurface(ZONES);
    const [now, setNow] = useState(Date.now());
    const [editingId, setEditingId] = useState(null);


    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 30000); // every 30s — plenty for minute-level display
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        async function loadReminders() {
            const res = await fetch('/api/notes', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setReminders(data.map((n) => n.reminder));
            }
        }
        loadReminders();
    }, []);

    function setReminder(reminder) {
        setReminders((prevReminders) => [...prevReminders, reminder]);
    }

    async function saveReminder(reminder) {
        setReminder(reminder);
        try {
            await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reminder),
                credentials: 'include',
            });
        } catch (err) {
            console.error('Failed to save reminder:', err);
        }
    }

    useEffect(() => {
        if (!iconBeingDragged) return; // nothing being dragged

        function onMove(e) { handleDrag(iconBeingDragged, e); }
        function onUp(e) { handleDragEnd(iconBeingDragged, e, saveReminder); }

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);

        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
    }, [iconBeingDragged]);

    function formatCountdown(msLeft) {
        if (msLeft <= 0) return 'Now';

        const totalMinutes = Math.floor(msLeft / 60000);   // ms → whole minutes
        const hours = Math.floor(totalMinutes / 60);         // whole hours
        const minutes = totalMinutes % 60;                   // minutes left after those hours

        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    useEffect(() => {
        const due = reminders.filter((r) => !r.notified && r.fireAt <= now);
        if (due.length === 0) return;

        due.forEach((reminder) => {
            deliverAlert(reminder); // step 3 — the swappable part
        });

        setReminders((prev) =>
            prev.map((r) =>
                due.some((d) => d.id === r.id) ? { ...r, notified: true } : r
            )
        );
    }, [now]);

    function deliverAlert(reminder) {
        const icon = ICONS.find((i) => i.iconId === reminder.iconId);
        if (Notification.permission === 'granted') {
            new Notification('Reminder', { body: icon?.label ?? 'Something to remember' });
        }
    }

    function testNotification() {
        if (Notification.permission === 'granted') {
            deliverAlert({ iconId: null }); // Provide a dummy reminder object
        } else {
            alert('Notification permission not granted. Please allow notifications first.');
        }
    }

    console.log('reminders', reminders);

    return (
        <div className="w-full max-w-3xl mx-auto p-4 flex flex-col gap-4 items-center">
            <div ref={canvasRef} className="relative w-full h-96 border-2 border-[hsl(319,25%,46%)] bg-[hsl(47,100%,81.6%)]">
                {ZONES.map((zone) => (
                    <div
                        key={zone.zoneId}
                        className="absolute border-2 border-dashed border-[hsl(319,25%,46%)]"
                        style={{
                            left: `${zone.x0 * 100}%`,
                            top: `${zone.y0 * 100}%`,
                            width: `${(zone.x1 - zone.x0) * 100}%`,
                            height: `${(zone.y1 - zone.y0) * 100}%`,
                        }}
                        title={`${zone.label} (${zone.triggerTime})`}
                    >
                        {zone.label}
                    </div>
                ))}
                {reminders.map((reminder) => {
                    const icon = ICONS.find((i) => i.iconId === reminder.iconId);
                    return (
                        <div
                            key={reminder.id}
                            className="absolute text-2xl -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
                            style={{
                                left: `${reminder.xPct * 100}%`,
                                top: `${reminder.yPct * 100}%`,
                            }}
                            title={icon?.label}
                        >
                            <div className="group flex flex-col items-center hover:bg-[hsl(319,25%,46%)] hover:text-[antiquewhite] rounded px-1 py-0.5">
                                {icon?.emoji}
                                {editingId === reminder.id ? (
                                    <input
                                        autoFocus
                                        defaultValue={reminder.text || ''}
                                        className="text-xs text-[antiquewhite] w-20 border hover:border-[antiquewhite] rounded px-1"
                                        onBlur={(e) => {
                                            const newText = e.target.value;
                                            setReminders((prev) =>
                                                prev.map((r) => (r.id === reminder.id ? { ...r, text: newText } : r))
                                            );
                                            setEditingId(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') e.target.blur(); // triggers the onBlur save above
                                            if (e.key === 'Escape') setEditingId(null); // cancel, no save
                                        }}
                                    />
                                ) : (
                                    <div className="text-xs text-[hsl(319,25%,46%)] w-20 hover:border-[antiquewhite] px-1 group-hover:text-[antiquewhite] text-center">
                                        {reminder.text || ''}
                                    </div>
                                )}
                                <div className="group-hover:opacity-100 text-xs text-[hsl(319,25%,46%)] opacity-0 group-hover:text-[antiquewhite]">
                                    {reminder.fireAt ? formatCountdown(new Date(reminder.fireAt).getTime() - Date.now()) : 'No fire time'}
                                </div>
                                <button className="text-xs group-hover:opacity-100 text-2xs text-[antiquewhite] opacity-0 hover:bg-[#f3c3e0] hover:text-[hsl(319,25%,46%)] rounded" onClick={() => {
                                    setReminders((prev) => prev.filter((r) => r.id !== reminder.id));
                                }}>
                                    remove
                                </button>
                                <button className="text-xs group-hover:opacity-100 text-2xs text-[antiquewhite] opacity-0 hover:bg-[#f3c3e0] hover:text-[hsl(319,25%,46%)] rounded" onClick={() => {
                                    setEditingId(reminder.id);
                                }}>
                                    edit
                                </button>
                            </div>


                        </div>
                    )
                })}
            </div>
            <div className="relative w-full h-16 border-2 border-[hsl(319,25%,46%)] bg-white flex flex-row items-center gap-3 px-3 overflow-x-auto">
                {ICONS.map((icon) => (
                    <div
                        key={icon.iconId}
                        onPointerDown={(e) => handleDragStart(icon.iconId, e)}
                        className={`text-2xl select-none cursor-grab shrink-0 ${iconBeingDragged === icon.iconId ? 'opacity-50' : ''
                            }`}
                        title={icon.label}>
                        {icon.emoji}
                    </div>
                ))}
            </div>
            <button
                className="text-[hsl(319,25%,46%)] border-2 border-[hsl(319,25%,46%)] px-3 py-1 bg-[#f3c3e0] hover:text-[antiquewhite] hover:bg-[hsl(319,25%,46%)]"
                onClick={() => {
                    if (Notification.permission !== 'granted') {
                        Notification.requestPermission();
                    }
                    if (Notification.permission === 'granted') {
                        new Notification('Notifications have been granted.');
                    }
                }}
            >
                Allow Alerts?
            </button>
            <button
                className="text-[hsl(319,25%,46%)] border-2 border-[hsl(319,25%,46%)] px-3 py-1 bg-[#f3c3e0] hover:text-[antiquewhite] hover:bg-[hsl(319,25%,46%)]"
                onClick={() => {
                    testNotification();
                }}
            >
                test notification
            </button>
        </div >
    );
}