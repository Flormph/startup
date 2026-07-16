const spriteSheet = new Image();
let spriteData = null;
let isLoaded = false;

export function loadSprites(imagePath, jsonPath) {
    return fetch(jsonPath)
        .then((res) => res.json())
        .then((json) => {
            spriteData = json;
            return new Promise((resolve) => {
                spriteSheet.onload = () => {
                    isLoaded = true;
                    resolve();
                };
                spriteSheet.src = imagePath;
            });
        });
}

export function getAnimation(name) {
    if (!spriteData) return null; // Return null if spriteData is not loaded yet
    const tag = spriteData.meta.frameTags.find((tag) => tag.name === name);
    if (!tag) return null; // Return null if the tag is not found

    const frames = [];
    for (let i = tag.from; i <= tag.to; i++) {
        const f = spriteData.frames[i];
        frames.push({
            x: f.frame.x,
            y: f.frame.y,
            w: f.frame.w,
            h: f.frame.h,
            duration: f.duration / 1000, // Convert duration from ms to seconds
        });
    }
    return frames;
}

export function isSpriteReady() {
    return isLoaded;
}

export function getSpriteSheet() {
    return spriteSheet;
}

export function createAnimationState() {
    return {
        currentAnim: null,
        frameIndex: 0,
        frameTimer: 0,
    };
}

export function updateAnimation(state, animName, deltaTime) {
    if (state.currentAnim !== animName) {
        state.currentAnim = animName;
        state.frameIndex = 0;
        state.frameTimer = 0;
    }
    const frames = getAnimation(state.currentAnim);
    if (!frames) return;

    state.frameTimer += deltaTime;
    const currentFrame = frames[state.frameIndex];
    if (state.frameTimer > currentFrame.duration) {
        state.frameTimer -= currentFrame.duration;
        state.frameIndex = (state.frameIndex + 1) % frames.length;
    }
}