import { isSpriteReady, getAnimation, getSpriteSheet, createAnimationState, updateAnimation } from './sprites.js';
// --- pose proportion configs ---
// each value is a fraction of pw/ph (player width/height in pixels), named for what it represents

const animState = createAnimationState();

const ANIM_IDLE = 'Idle';
const ANIM_WALK = 'Walk';

const UPRIGHT_POSE = {
    legWidthRatio: 0.15,
    legHeightRatio: 0.25,
    hipXRatio: 0.5,
    hipYRatio: 0.78,

    bodyWidthRatio: 0.4,
    bodyTopRatio: 0.22,
    bodyHeightRatio: 0.58,

    armWidthRatio: 0.12,
    armLengthRatio: 0.3,
    shoulderXRatio: 0.5,
    shoulderYRatio: 0.3,

    headCenterXRatio: 0.35,
    headCenterYRatio: 0.25,
    headRadiusXRatio: 0.42,
    headRadiusYRatio: 0.13,
    headTiltRadians: -0.05,

    gillBaseXRatio: 0.65,
    gillBaseYRatio: 0.23,
};

const GALLOP_POSE = {
    bodyLengthRatio: 0.7,
    bodyThicknessRatio: 0.4,
    bodyLeftRatio: 0.15,
    bodyTopRatio: 0.3,

    legWidthRatio: 0.08,
    legHeightRatio: 0.35,
    frontHipXRatio: 0.75,
    backHipXRatio: 0.25,
    hipYRatio: 0.7,

    headCenterXRatio: 0.1,
    headCenterYRatio: 0.38,
    headRadiusRatio: 0.25,

    gillBaseXRatio: 0.3,
    gillBaseYRatio: 0.2,
};

// shared gill shape, reused by both poses
const GILLS_UPRIGHT = {
    angleDegrees: 150,
    angleDiffDegrees: 15,
    lengthRatio: 0.45,
    spacingRatio: 0.07,
    lineWidthRatio: 0.04,
    color: 'hsl(280,40%,55%)',
};

const GILLS_GALLOP = {
    angleDegrees: 150,
    angleDiffDegrees: 15,
    lengthRatio: 0.25,
    spacingRatio: 0.07,
    lineWidthRatio: 0.04,
    color: 'hsl(280,40%,55%)',
};

const BODY_COLOR = 'hsl(319,25%,46%)';

function drawGills(ctx, pw, ph, poseConfig, gillConfig) {
    const gillAngle = gillConfig.angleDegrees * (Math.PI / 180);
    const gillAngleDiff = gillConfig.angleDiffDegrees * (Math.PI / 180);
    const gillLength = pw * gillConfig.lengthRatio;
    const gillSpacing = ph * gillConfig.spacingRatio;

    ctx.strokeStyle = gillConfig.color;
    ctx.lineWidth = Math.max(1, pw * gillConfig.lineWidthRatio);

    const baseX = pw * poseConfig.gillBaseXRatio;
    const baseY = ph * poseConfig.gillBaseYRatio;

    for (let i = -1; i <= 1; i++) {
        const startX = baseX;
        const startY = baseY + i * gillSpacing;
        const angle = gillAngle + i * gillAngleDiff;
        const endX = startX - Math.cos(angle) * gillLength;
        const endY = startY - Math.sin(angle) * gillLength;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
}

function drawUprightPose(ctx, pw, ph, swingAngle, legStanceAngle, armSwingAngle) {
    const p = UPRIGHT_POSE;
    ctx.fillStyle = BODY_COLOR;

    const legWidth = pw * p.legWidthRatio;
    const legHeight = ph * p.legHeightRatio;
    const hipX = pw * p.hipXRatio;
    const hipY = ph * p.hipYRatio;

    drawLimb(ctx, hipX, hipY, legWidth, legHeight, swingAngle + legStanceAngle);
    drawLimb(ctx, hipX, hipY, legWidth, legHeight, -swingAngle - legStanceAngle);

    const bodyWidth = pw * p.bodyWidthRatio;
    const bodyX = (pw - bodyWidth) / 2;
    ctx.fillRect(bodyX, ph * p.bodyTopRatio, bodyWidth, ph * p.bodyHeightRatio);

    const armWidth = pw * p.armWidthRatio;
    const armLength = ph * p.armLengthRatio;
    const shoulderX = pw * p.shoulderXRatio;
    const shoulderY = ph * p.shoulderYRatio;

    drawLimb(ctx, shoulderX, shoulderY, armWidth, armLength, -armSwingAngle);
    drawLimb(ctx, shoulderX, shoulderY, armWidth, armLength, armSwingAngle);

    drawGills(ctx, pw, ph, p, GILLS_UPRIGHT);

    ctx.fillStyle = BODY_COLOR;
    ctx.beginPath();
    ctx.ellipse(
        pw * p.headCenterXRatio, ph * p.headCenterYRatio,
        pw * p.headRadiusXRatio, ph * p.headRadiusYRatio,
        p.headTiltRadians, 0, Math.PI * 2
    );
    ctx.fill();
}

function drawGallopPose(ctx, pw, ph, swingAngle) {
    const p = GALLOP_POSE;
    ctx.fillStyle = BODY_COLOR;

    const bodyLength = pw * p.bodyLengthRatio;
    const bodyThickness = ph * p.bodyThicknessRatio;
    ctx.fillRect(pw * p.bodyLeftRatio, ph * p.bodyTopRatio, bodyLength, bodyThickness);

    const legWidth = pw * p.legWidthRatio;
    const legHeight = ph * p.legHeightRatio;
    const hipY = ph * p.hipYRatio;

    drawLimb(ctx, pw * p.frontHipXRatio, hipY, legWidth, legHeight, swingAngle);
    drawLimb(ctx, pw * p.backHipXRatio, hipY, legWidth, legHeight, -swingAngle);

    drawGills(ctx, pw, ph, p, GILLS_GALLOP);

    ctx.beginPath();
    ctx.ellipse(
        pw * p.headCenterXRatio, ph * p.headCenterYRatio,
        pw * p.headRadiusRatio, ph * p.headRadiusRatio,
        0, 0, Math.PI * 2
    );
    ctx.fill();
}


function drawLimb(ctx, pivotX, pivotY, width, length, angle) {
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(angle);
    ctx.fillRect(-width / 2, 0, width, length); // extends downward from the pivot, in local rotated space
    ctx.restore();
}

// draw player
function drawPlayer(ctx, player, unit, time, deltaTime) {
    const px = player.x * unit;
    const py = player.y * unit;
    const pw = player.width * unit;
    const ph = player.height * unit;

    ctx.save();
    ctx.translate(px + pw / 2, py + ph / 2);
    ctx.scale(-player.facing, 1);
    ctx.translate(-pw / 2, -ph / 2);

    const isMoving = Math.abs(player.vx) > 0.1;
    const hasSpriteFor = !player.isGalloping && !player.isCrouching && player.onGround;

    if (isSpriteReady() && hasSpriteFor) {
        const animName = isMoving ? ANIM_WALK : ANIM_IDLE;
        updateAnimation(animState, animName, deltaTime);

        const frames = getAnimation(animName);
        const frame = frames && frames[animState.frameIndex] ? frames[animState.frameIndex] : null;

        if (frame) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-pw, 0);
            ctx.drawImage(getSpriteSheet(), frame.x, frame.y, frame.w, frame.h, 0, 0, pw, ph);
            ctx.restore();
        } else {
            console.warn(`Animation frame not found for ${animName} at index ${animState.frameIndex}`, { frames });
            drawProceduralFallback();
        }
    } else { // if the sprite isn't created yet or not ready yet or the player is in a special state, fall back to drawing the pose
        drawProceduralFallback();
    }

    function drawProceduralFallback() {
        // pose parameters

        let legSwingSpeed = 12;
        let legSwingMax = 0.5;
        let armSwingMax = 0.5;
        let legStanceAngle = 0; // default angle for legs when standing still

        if (player.isGalloping) {
            legSwingSpeed = 20;
            legSwingMax = 0.9;
            armSwingMax = 0.2;
        } else if (player.isCrouching) {
            legSwingSpeed = 8;
            legSwingMax = 0.25;
        }

        if (!player.onGround) {
            legStanceAngle = 0.3; // legs slightly bent when in the air
            armSwingMax = 0.1;
        }

        const swingAngle = isMoving && player.onGround
            ? Math.sin(time * legSwingSpeed) * legSwingMax
            : 0;
        const armSwingAngle = isMoving && player.onGround
            ? Math.sin(time * legSwingSpeed + Math.PI) * armSwingMax
            : 0;


        // draw poses
        if (player.isGalloping) {
            drawGallopPose(ctx, pw, ph, swingAngle);
        } else {
            drawUprightPose(ctx, pw, ph, swingAngle, legStanceAngle, armSwingAngle);
        }
    }
    ctx.restore();
}

export function draw(ctx, canvas, unit, player, platforms, time, deltaTime) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw platforms
    ctx.fillStyle = 'hsl(319,25%,46%)';
    for (const platform of platforms) {
        ctx.fillRect(platform.x * unit, platform.y * unit, platform.width * unit, platform.height * unit);
    }



    drawPlayer(ctx, player, unit, time, deltaTime);
}