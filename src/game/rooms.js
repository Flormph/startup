export const EXIT_CHARS = { L: 'left', R: 'right', U: 'up', D: 'down' };

export function parseRoom(rows, tileSize = 1) {
    const platforms = [];
    const exits = [];
    const teleports = [];
    const enemies = [];
    const players = [];
    const items = [];

    rows.forEach((row, rowIndex) => {
        row.split('').forEach((char, colIndex) => {
            const x = colIndex * tileSize;
            const y = rowIndex * tileSize;

            if (char === '#') {
                platforms.push({ x, y, width: tileSize, height: tileSize });
            } else if (EXIT_CHARS[char]) {
                exits.push({ x, y, direction: EXIT_CHARS[char], width: tileSize, height: tileSize });
            } else if (char >= '1' && char <= '9') {
                teleports.push({ x, y, width: tileSize, height: tileSize, id: char });
            } else if (char === 'E') {
                enemies.push({ x, y, width: tileSize, height: tileSize }); // position comes from the grid
            } else if (char === 'P') {
                players.push({ x, y, width: tileSize, height: tileSize }); // position comes from the grid
            } else if (char === 'I') {
                items.push({ x, y, width: tileSize, height: tileSize }); // position comes from the grid
            } else if (char === 'O') {
                exits.push({ x, y, direction: 'up', width: tileSize, height: tileSize }); // Example for a special exit TODO: define special exit behavior
                throw new Error("Special exit behavior not implemented yet.");
            }
        });
    });
    return { platforms, exits, teleports, enemies, players, items };
}

export function getAdjacentRoom(room, direction) {
    switch (direction) {
        case 'up': return [room[0], room[1] - 1]; // Assuming y decreases as you go up
        case 'down': return [room[0], room[1] + 1];
        case 'left': return [room[0] - 1, room[1]];
        case 'right': return [room[0] + 1, room[1]];
    }
}

export function getOppositeDirection(direction) {
    switch (direction) {
        case 'up': return 'down';
        case 'down': return 'up';
        case 'left': return 'right';
        case 'right': return 'left';
    }
}

export function findEntryPoint(destExits, travelDirection, player) {
    const entryDirection = getOppositeDirection(travelDirection);
    const match = destExits.find((e) => e.direction === entryDirection);
    if (!match) return { x: 2, y: 2 };

    switch (entryDirection) {
        case 'left':
            return { x: match.x + 1.1, y: player.y };
        case 'right':
            return { x: match.x - player.width - 0.1, y: player.y };
        case 'up':
            return { x: player.x, y: match.y + 1.1 };
        case 'down':
            return { x: player.x, y: match.y - player.height - 0.1 };
    }
}

export function checkExitTrigger(player, exit) {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    const insideExit =
        centerX >= exit.x && centerX <= exit.x + exit.width &&
        centerY >= exit.y && centerY <= exit.y + exit.height;

    if (!insideExit) return false;

    switch (exit.direction) {
        case 'left': return player.vx < 0;
        case 'right': return player.vx > 0;
        case 'up': return player.vy < 0;
        case 'down': return player.vy > 0;
        default: return false;
    }
}