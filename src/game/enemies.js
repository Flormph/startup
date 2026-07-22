import { checkCollision } from '../utils/collision.js';

export function createEnemy(type, position) {
    return {
        id,
        type,
        x: position[0],
        y: position[1],
        aiType: type.aiType,
        width: type.width,
        height: type.height,
        speed: type.speed,
        health: type.health,
        isFlying: type.isFlying,
        isClimbing: type.isClimbing,

    }
}

export function updateEnemy(enemy, deltaTime, player, roomLayout) {
    switch (enemy.type.aiType) {
        case ('patrolEnemy'):
            // Move the enemy in its current direction
            break;
        case ('chaseEnemy'):
            // Move the enemy towards the player
            break;
        case ('flyingEnemy'):
            // Move the enemy in a flying pattern
            break;
        default:
            console.warn(`Unknown AI type: ${enemy.type.aiType}`);
    }
}