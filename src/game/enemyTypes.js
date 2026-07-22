export const ENEMY_TYPES = {
    isopod: {
        aiType: 'perimeter', //wraps around platforms
        width: 0.8,
        height: 0.8,
        speed: 2,
        health: 30,
        damage: 15,
        isFlying: false,
        isClinging: true,
        clingSurface: 'down', // the direction the enemy clings to surfaces
        clingDirection: 1, // 1 = CW, -1 = CCW
    }
}