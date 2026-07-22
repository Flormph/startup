import { checkCollision } from '../utils/collision.js';
import { GRAVITY, TERMINAL_VELOCITY } from './constants.js';
import { ENEMY_TYPES } from './enemyTypes.js';

export function createEnemy(typeKey, config) {
    const type = ENEMY_TYPES[typeKey];
    if (!type) {
        throw new Error(`Unknown enemy type: ${typeKey}`);
    }

    return {
        id: config.id,
        typeKey,
        x: config.position[0],
        y: config.position[1],
        width: type.width,
        height: type.height,
        speed: type.speed,
        health: type.health,
        maxHealth: type.health,
        damage: type.damage,
        isFlying: type.isFlying,
        isClinging: type.isClinging,
        aiType: type.aiType,

        clingSide: type.clingSide || 'top', // default to clinging to the top if not specified
        clingDirection: type.clingDirection || 1, // default to clockwise if not specified};
    };
}

// normal = direction to probe TOWARD the surface
// axis = moving along this axis (x or y) to find the edge of the surface
const SIDE_INFO = {
    top: { axis: 'x', normal: { x: 0, y: 1 } },
    bottom: { axis: 'x', normal: { x: 0, y: -1 } },
    left: { axis: 'y', normal: { x: 1, y: 0 } },
    right: { axis: 'y', normal: { x: -1, y: 0 } },
}

const CW_TRAVEL_SIGN = { top: 1, right: 1, bottom: -1, left: -1 };

function edgeProbe(enemy, direction, roomLayout) {
    const probeDistance = 0.1;
}

export function updateEnemy(enemy, deltaTime, player, roomLayout) {
    switch (enemy.state) {
        case ('patrol'):
            // Move the enemy in its current direction
            break;
        case ('chase'):
            // Move the enemy towards the player
            break;
        default:
            console.warn(`Unknown AI type: ${enemy.type.aiType}`);
    }

    // Check for collisions with the player
    if (checkCollision(enemy, player)) {
        // Handle collision (e.g., reduce player health)
    }

    // Gravity and collision detection with platforms
    if (!enemy.isFlying) {
        enemy.vy += GRAVITY * deltaTime;
        enemy.vy = Math.min(enemy.vy, TERMINAL_VELOCITY);
    }

    // Wall collision detection and response
    for (const platform of roomLayout) {
        if (checkCollision(enemy, platform)) {
            if (enemy.vx > 0) {
                enemy.x = platform.x - enemy.width;
            } else if (enemy.vx < 0) {
                enemy.x = platform.x + platform.width;
            }
        }
    }
}