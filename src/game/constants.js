export const ASPECT_RATIO = 16 / 9;
export const ANIM_VERT_IDLE = 'vertIdle';
export const ANIM_VERT_WALK = 'vertWalk';
export const ANIM_HORZ_IDLE = 'horzIdle';
export const ANIM_HORZ_WALK = 'horzWalk';
export const SPRITE_OFFSET_VERT_Y = 6 // offset in pixels from the top of the sprite sheet to the top of the sprite
export const SPRITE_OFFSET_VERT_X = 0 // offset in pixels from the left of the sprite sheet to the left of the sprite
export const SPRITE_OFFSET_HORZ_Y = 20 // offset in pixels from the top of the sprite sheet to the top of the sprite
export const SPRITE_OFFSET_HORZ_X = 0 // offset in pixels from the left of the sprite sheet to the left of the sprite
export const SPRITE_ASPECT = {
    vert: { width: 13, height: 26 },
    horz: { width: 32, height: 12 },
}

export const SPRITE_CROP = {
    vert: { x: SPRITE_OFFSET_VERT_X, y: SPRITE_OFFSET_VERT_Y, width: 13, height: 26 }, // offset + size of the sprite in the sprite sheet
    horz: { x: SPRITE_OFFSET_HORZ_X, y: SPRITE_OFFSET_HORZ_Y, width: 32, height: 12 },
}
export const GRAVITY = 120; // units per second squared
export const MOVE_SPEED = 10; // units per second
export const JUMP_FORCE = 32; // units per second (initial upward velocity)
export const COLUMNS = 30; // how many units wide the visible world is
export const COYOTE_TIME = 0.15; // seconds of grace period after leaving the ground
export const SPRINT_JUMP_MULT = 1.2; // how much higher the player jumps when sprinting
export const SPRINT_TIME = 1.5; // how many seconds until sprinting
export const SPRINT_MULT = 1.5; // how much faster sprinting is than walking
export const SPRINT_GRACE_PERIOD = 0.2; // additional seconds allowed for sprinting after the timer runs out
export const STAND_HEIGHT = SPRITE_ASPECT.vert.height / 16; // standard height of the player character
export const STAND_WIDTH = SPRITE_ASPECT.vert.width / 16; // standard width of the player character
export const CROUCH_HEIGHT = SPRITE_ASPECT.horz.height / 16; // height of the player character when crouching
export const CROUCH_WIDTH = SPRITE_ASPECT.horz.width / 16; // width of the player while crouching
export const CROUCH_SPEED_MULT = 0.5; // how much slower the player moves when crouching
export const GALLOP_WIDTH = SPRITE_ASPECT.horz.width / 16; // width of the player character when galloping
export const GALLOP_HEIGHT = SPRITE_ASPECT.horz.height / 16; // height of the player character when galloping
export const GALLOP_SPEED_MULT = 1.5; // how much faster the player moves when galloping
export const POUNCE_JUMP_MULT = .9; // how much higher the player jumps when pouncing
export const POUNCE_SPEED_MULT = 3.0; // how much faster the player moves when pouncing
export const WALL_GRACE_PERIOD = 0.3; // additional seconds allowed for wall contact after leaving the wall
export const WALL_JUMP_FORCE = 28; //  vertical force applied when performing a wall jump
export const WALL_JUMP_PUSH = 12; // horizontal force applied when performing a wall jump
export const WALL_SLIDE_SPEED = 8.0; // speed at which the player slides down the wall
export const WALL_JUMP_LOCK_TIME = 0.1; // duration for which horizontal movement is locked after a wall jump