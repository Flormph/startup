function drawLimb(ctx, pivotX, pivotY, width, length, angle) {
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(angle);
    ctx.fillRect(-width / 2, 0, width, length); // extends downward from the pivot, in local rotated space
    ctx.restore();
}

// draw player
function drawPlayer(ctx, player, unit, time) {
    const px = player.x * unit;
    const py = player.y * unit;
    const pw = player.width * unit;
    const ph = player.height * unit;
    const facing = player.facing;

    ctx.save();
    ctx.translate(px + pw / 2, py + ph / 2);
    ctx.scale(-facing, 1);
    ctx.translate(-pw / 2, -ph / 2);

    // legs — swing forward/back along X, opposite phase, only while moving
    const isMoving = Math.abs(player.vx) > 0.1;
    const swingAngle = isMoving ? Math.sin(time * 12) * 0.5 : 0; // ~28° max swing, in radians
    ctx.fillStyle = 'hsl(319,25%,46%)';


    //  legs - hinge from hips

    const legWidth = pw * 0.15;
    const legHeight = ph * 0.25;
    const hipX = pw * 0.5;
    const hipY = ph * 0.78;

    drawLimb(ctx, hipX, hipY, legWidth, legHeight, swingAngle);
    drawLimb(ctx, hipX, hipY, legWidth, legHeight, -swingAngle);


    // body — narrower than the full hitbox width
    const bodyWidth = pw * 0.4;
    const bodyX = (pw - bodyWidth) / 2;
    ctx.fillRect(bodyX, ph * 0.22, bodyWidth, ph * 0.58);


    // arms — swing from shoulders, opposite phase from legs
    const armWidth = pw * 0.12;
    const armLength = ph * 0.3;
    const shoulderX = pw * 0.5;
    const shoulderY = ph * 0.3;

    drawLimb(ctx, shoulderX, shoulderY, armWidth, armLength, -swingAngle);
    drawLimb(ctx, shoulderX, shoulderY, armWidth, armLength, swingAngle);


    // gills — a few angled strokes near the head/neck, both sides
    const gillAngle = 150 * (Math.PI / 180);
    const gillLength = pw * .45;
    const gillSpacing = ph * 0.07; // interval between gills
    const gillAngleDiff = 15 * (Math.PI / 180); // difference in angle between consecutive gills

    ctx.strokeStyle = 'hsl(280,40%,55%)';
    ctx.lineWidth = Math.max(1, pw * 0.04);

    const gillBaseX = pw * 0.65;
    const gillBaseY = ph * 0.23;

    for (let i = -1; i <= 1; i++) {
        const startX = gillBaseX;
        const startY = gillBaseY + i * gillSpacing; // stack three gills vertically at the head/neck
        const endX = startX - Math.cos(gillAngle + i * gillAngleDiff) * gillLength; // swept backward
        const endY = startY - Math.sin(gillAngle + i * gillAngleDiff) * gillLength; // and upward

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }


    // head — angled ellipsoid
    ctx.fillStyle = 'hsl(319,25%,46%)';
    ctx.beginPath();
    ctx.ellipse(
        pw * 0.35, ph * 0.25,      // center
        pw * 0.42, ph * 0.13,     // radiusX, radiusY
        -0.05,                     // rotation, in radians — tilts the ellipse
        0, Math.PI * 2
    );
    ctx.fill();

    ctx.restore();

}

export function draw(ctx, canvas, unit, player, platforms, time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw platforms
    ctx.fillStyle = 'hsl(319,25%,46%)';
    for (const platform of platforms) {
        ctx.fillRect(platform.x * unit, platform.y * unit, platform.width * unit, platform.height * unit);
    }



    drawPlayer(ctx, player, unit, time);
}