export function draw(ctx, canvas, unit, player, platforms) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw platforms
    ctx.fillStyle = 'hsl(319,25%,46%)';
    for (const platform of platforms) {
        ctx.fillRect(platform.x * unit, platform.y * unit, platform.width * unit, platform.height * unit);
    }

    // draw player
    ctx.fillStyle = 'hsl(319,25%,46%)';
    ctx.fillRect(player.x * unit, player.y * unit, player.width * unit, player.height * unit);
    ctx.fillStyle = 'black';
    ctx.fillText(`sprint: ${player.sprintTimer.toFixed(2)}`, 10, 20);
}