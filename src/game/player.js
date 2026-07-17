import { checkCollision } from './collision.js';
import {
    GRAVITY, MOVE_SPEED, JUMP_FORCE, COYOTE_TIME, SPRINT_JUMP_MULT,
    SPRINT_TIME, SPRINT_MULT, SPRINT_GRACE_PERIOD,
    STAND_HEIGHT, STAND_WIDTH, CROUCH_HEIGHT, CROUCH_WIDTH, CROUCH_SPEED_MULT,
    GALLOP_WIDTH, GALLOP_HEIGHT, GALLOP_SPEED_MULT, POUNCE_JUMP_MULT,
    POUNCE_SPEED_MULT, WALL_GRACE_PERIOD, WALL_JUMP_FORCE, WALL_JUMP_PUSH,
    WALL_SLIDE_SPEED, WALL_JUMP_LOCK_TIME,
} from './constants.js';

export function createPlayer() {
    return {
        x: 2,
        y: 5,
        width: STAND_WIDTH,
        height: STAND_HEIGHT,
        vx: 0,
        vy: 0,
        onGround: false,
        coyoteTimer: 0,
        wallCoyoteTimer: 0,
        sprintTimer: 0,
        wallJumpLockTimer: 0,
        isCrouching: false,
        isGalloping: false,
        isPouncing: false,
        facing: 1,
        wallSide: 0,
    };
}

function exitGallop(player, platforms) {
    const heightDiff = GALLOP_HEIGHT - CROUCH_HEIGHT;
    const widthDiff = player.width - STAND_WIDTH;

    const crouchX = player.facing === -1 ? player.x + widthDiff : player.x;

    const crouchHitbox = {
        x: crouchX,
        y: player.y + heightDiff,
        width: STAND_WIDTH,
        height: CROUCH_HEIGHT,
    };

    const blocked = platforms.some((p) => checkCollision(crouchHitbox, p));

    if (!blocked) {
        player.x = crouchHitbox.x;
        player.y = crouchHitbox.y;
        player.width = STAND_WIDTH;
        player.height = CROUCH_HEIGHT;
        player.isGalloping = false;
        player.isCrouching = true;
        return true;
    }
    return false;
}

function checkWallContact(player, platforms) {
    const probeDepth = 0.1; // how far to check for wall contact    
    const leftCheck = { x: player.x - probeDepth, y: player.y, width: probeDepth, height: player.height };
    const rightCheck = { x: player.x + player.width + probeDepth, y: player.y, width: probeDepth, height: player.height };

    if (platforms.some((p) => checkCollision(leftCheck, p))) return -1;
    if (platforms.some((p) => checkCollision(rightCheck, p))) return 1;
    return 0; // No wall contact
}

export function updatePlayer(player, deltaTime, keys, keysPressed, platforms) {
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.facing = -1;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.facing = 1;
    }

    // Decrement wall jump lock timer
    if (player.wallJumpLockTimer > 0) {
        player.wallJumpLockTimer = Math.max(0, player.wallJumpLockTimer - deltaTime);
    }
    if (player.onGround) {
        player.coyoteTimer = COYOTE_TIME;
    } else {
        player.coyoteTimer -= deltaTime;
    }

    // GALLOP

    const wantsToCrouch = keys['ArrowDown'] || keys['KeyS'] || keys['KeyC'];
    const gallopTogglePressed = keysPressed['ArrowDown'] || keysPressed['KeyS'] || keysPressed['KeyC'];
    const isSprinting = player.sprintTimer >= SPRINT_TIME;

    if (gallopTogglePressed && isSprinting && player.onGround && !player.isGalloping) { // Enter gallop from sprint
        const currentHeight = player.isCrouching ? CROUCH_HEIGHT : STAND_HEIGHT;
        const heightDiff = currentHeight - GALLOP_HEIGHT;
        const widthDiff = GALLOP_WIDTH - player.width;

        const gallopX = player.facing === -1 ? player.x - widthDiff : player.x; //checks which way player is facing for hitbox change

        const gallopHitbox = {
            x: gallopX,
            y: player.y + heightDiff,
            width: GALLOP_WIDTH,
            height: GALLOP_HEIGHT,
        };

        const blocked = platforms.some((p) => checkCollision(gallopHitbox, p));

        if (!blocked) {
            player.x = gallopHitbox.x;
            player.y = gallopHitbox.y;
            player.width = GALLOP_WIDTH;
            player.height = GALLOP_HEIGHT;
            player.isGalloping = true;
            player.isCrouching = false;
        }
    }


    //POUNCE

    const wantsToPounce = (keysPressed['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.isGalloping;

    if (wantsToPounce) {
        exitGallop(player, platforms); // shrink hitbox back
        player.vy = -JUMP_FORCE * POUNCE_JUMP_MULT; // apply pounce
        player.vx = player.facing * MOVE_SPEED * POUNCE_SPEED_MULT; // apply horizontal velocity for pounce
        player.onGround = false; // player is in the air after pounce
        player.isPouncing = true;
    } else if (player.isGalloping && !(keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowRight'] || keys['KeyD'])) {
        exitGallop(player, platforms); // shrink hitbox back if player stops moving while galloping
    }


    //CROUCH

    if (wantsToCrouch && !player.isCrouching && !player.isGalloping) {
        const heightDiff = player.height - CROUCH_HEIGHT;
        player.height = CROUCH_HEIGHT;
        player.width = CROUCH_WIDTH;
        player.y += heightDiff;
        player.isCrouching = true;
    } else if (!wantsToCrouch && player.isCrouching) {
        const heightDiff = STAND_HEIGHT - CROUCH_HEIGHT;
        const standingHitbox = {
            x: player.x,
            y: player.y - heightDiff,
            width: STAND_WIDTH,
            height: STAND_HEIGHT,
        };

        const blocked = platforms.some((p) => checkCollision(standingHitbox, p));

        if (!blocked) {
            player.height = STAND_HEIGHT;
            player.width = STAND_WIDTH;
            player.y -= heightDiff;
            player.isCrouching = false;
        }
    }

    const speedMult = player.isGalloping ? GALLOP_SPEED_MULT : player.isCrouching ? CROUCH_SPEED_MULT : 1;


    // BASIC MOVEMENT

    if (!player.isPouncing && player.wallJumpLockTimer <= 0) {
        if (keys['ArrowLeft'] || keys['KeyA']) {
            if (player.isGalloping) {
                player.vx = -MOVE_SPEED * GALLOP_SPEED_MULT;
            } else if (player.sprintTimer < SPRINT_TIME) {
                player.vx = -MOVE_SPEED * speedMult;
                player.sprintTimer = Math.min(SPRINT_TIME + SPRINT_GRACE_PERIOD, player.sprintTimer + deltaTime);
            } else {
                player.vx = -MOVE_SPEED * SPRINT_MULT * speedMult;
                player.sprintTimer = Math.min(SPRINT_TIME + SPRINT_GRACE_PERIOD, player.sprintTimer + deltaTime);
            }
        } else if (keys['ArrowRight'] || keys['KeyD']) {
            if (player.isGalloping) {
                player.vx = MOVE_SPEED * GALLOP_SPEED_MULT;
            } else if (player.sprintTimer < SPRINT_TIME) {
                player.vx = MOVE_SPEED * speedMult;
                player.sprintTimer = Math.min(SPRINT_TIME + SPRINT_GRACE_PERIOD, player.sprintTimer + deltaTime);
            } else {
                player.vx = MOVE_SPEED * SPRINT_MULT * speedMult;
                player.sprintTimer = Math.min(SPRINT_TIME + SPRINT_GRACE_PERIOD, player.sprintTimer + deltaTime);
            }
        } else {
            player.vx = 0;
            player.sprintTimer = Math.max(0, player.sprintTimer - deltaTime);
        }

        if ((keysPressed['Space'] || keysPressed['ArrowUp'] || keysPressed['KeyW']) && player.coyoteTimer > 0 && !player.isCrouching) {
            if (player.sprintTimer >= SPRINT_TIME) {
                player.vy = -JUMP_FORCE * SPRINT_JUMP_MULT;
            } else {
                player.vy = -JUMP_FORCE;
            }
            player.onGround = false;
            player.coyoteTimer = 0;
        }
    }


    // GRAVITY and WALL SLIDING

    player.vy += GRAVITY * deltaTime;

    const wallSide = checkWallContact(player, platforms);
    const pressingIntoWall =
        (wallSide === -1 && (keys['ArrowLeft'] || keys['KeyA'])) ||
        (wallSide === 1 && (keys['ArrowRight'] || keys['KeyD']));

    player.isWallSliding = wallSide !== 0 && !player.onGround && pressingIntoWall;

    if (player.isWallSliding) {
        player.vy = Math.min(player.vy, WALL_SLIDE_SPEED); // cap fall speed while sliding
        player.wallSide = wallSide; // store which side the wall is on for wall jump logic
        player.wallCoyoteTimer = WALL_GRACE_PERIOD; // reset wall coyote timer when starting to wall slide
        player.sprintTimer = 0;
    } else {
        player.wallCoyoteTimer = Math.max(0, player.wallCoyoteTimer - deltaTime); // decrement wall coyote timer when not wall sliding
    }


    // WALL COLLISION

    player.x += player.vx * deltaTime;
    for (const platform of platforms) {
        if (checkCollision(player, platform)) {
            if (player.vx > 0) {
                player.x = platform.x - player.width;
            } else if (player.vx < 0) {
                player.x = platform.x + platform.width;
            }
        }
    }


    // WALL JUMP

    const pressingAwayFromWall =
        (player.wallSide === -1 && (keys['ArrowRight'] || keys['KeyD'])) ||
        (player.wallSide === 1 && (keys['ArrowLeft'] || keys['KeyA']));

    const wantsWallJump =
        (keysPressed['Space'] || keysPressed['ArrowUp'] || keysPressed['KeyW'])
        && player.wallCoyoteTimer > 0
        && pressingAwayFromWall;

    if (wantsWallJump) {
        player.vy = -WALL_JUMP_FORCE; // apply vertical force for wall jump
        player.vx = -player.wallSide * WALL_JUMP_PUSH; // apply horizontal force for wall jump
        player.facing = -player.wallSide; // face away from the wall after wall jump
        player.isWallSliding = false; // no longer sliding on the wall after wall jump
        player.wallCoyoteTimer = 0; // reset wall coyote timer after wall jump
        player.onGround = false; // player is no longer on the ground after wall jump
        player.wallJumpLockTimer = WALL_JUMP_LOCK_TIME; // lock horizontal movement after wall jump
        player.isPouncing = false; // cancel pounce state after wall jump
    }


    // LANDING

    player.onGround = false;
    player.y += player.vy * deltaTime;
    for (const platform of platforms) {
        if (checkCollision(player, platform)) {
            if (player.vy > 0) {
                player.y = platform.y - player.height;
                player.vy = 0;
                player.onGround = true;
                if (player.isPouncing) {
                    player.sprintTimer = 0;
                    player.isPouncing = false;
                }

            } else if (player.vy < 0) {
                player.y = platform.y + platform.height;
                player.vy = 0;
            }
        }
    }
}