// Room data is loaded from exported JSON files in src/game/game_map/{area}/{x,y}.json
// To update rooms, export from the Axolotl Map Editor to src/game/game_map/
//
// Usage:
//   getRoom("New Area", [0, 0])   → returns the room object, or null if not found
//   getRoomKey([0, 0])            → returns "0,0"

const roomModules = import.meta.glob('./game_map/**/*.json', { eager: true });

export function getRoomKey(room) {
    return `${room[0]},${room[1]}`;
}

export function getRoom(area, room) {
    const key = `./game_map/${area}/${getRoomKey(room)}.json`;
    const mod = roomModules[key];
    return mod ? (mod.default ?? mod) : null;
}

// Returns all loaded room keys for a given area as an array of [x, y] pairs
export function getRoomsInArea(area) {
    const prefix = `./game_map/${area}/`;
    return Object.keys(roomModules)
        .filter(k => k.startsWith(prefix))
        .map(k => {
            const name = k.slice(prefix.length).replace('.json', '');
            const [x, y] = name.split(',').map(Number);
            return [x, y];
        });
}
