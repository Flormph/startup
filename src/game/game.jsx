import React, { useRef, useEffect } from 'react';

const ASPECT_RATIO = 16 / 9;
const GRAVITY = 30; // units per second squared
const MOVE_SPEED = 6; // units per second
const JUMP_FORCE = 15; // units per second (initial upward velocity)
const COLUMNS = 20; // how many units wide the visible world is

export function Game() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;

        function resizeCanvas() {
            const width = container.clientWidth;
            const height = width / ASPECT_RATIO;
            canvas.width = width;   // set directly on the DOM node
            canvas.height = height; // no setState, no re-render
        }

        resizeCanvas(); // set initial size

        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(container);

        function getUnit(canvasWidth) {
            return canvasWidth / COLUMNS;
        }

        // player stats
        const player = {
            x: 2, // 2 units from left
            y: 5, // 5 units from top
            width: .6, // 0.6 units wide
            height: .8, // 0.8 units tall
            vx: 0,
            vy: 0,
            onGround: false,
        }

        function getPlatforms(columns, rows) {
            return [
                { x: 0, y: rows - 1, width: columns, height: 1 },        // ground, 1 unit tall
                { x: columns * 0.25, y: rows * 0.6, width: 3, height: 0.4 },
                { x: columns * 0.55, y: rows * 0.4, width: 3, height: 0.4 },
            ];
        }

        function checkCollision(rectA, rectB) {
            return (
                rectA.x < rectB.x + rectB.width &&
                rectA.x + rectA.width > rectB.x &&
                rectA.y < rectB.y + rectB.height &&
                rectA.y + rectA.height > rectB.y
            );
        }

        // input handling
        const keys = {};
        function handleKeyDown(e) {
            keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        }
        function handleKeyUp(e) { keys[e.code] = false; }
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // game loop with delta time
        let lastTime = performance.now();

        function gameLoop(currentTime) {
            const deltaTime = (currentTime - lastTime) / 1000; // convert to seconds
            lastTime = currentTime;

            update(deltaTime);
            draw();

            animationId = requestAnimationFrame(gameLoop);
        }

        function update(deltaTime) {
            // horizontal movement
            if (keys['ArrowLeft'] || keys['KeyA']) {
                player.vx = -MOVE_SPEED;
            } else if (keys['ArrowRight'] || keys['KeyD']) {
                player.vx = MOVE_SPEED;
            } else {
                player.vx = 0;
            }

            // vertical movement (no mid air jumps)
            if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.onGround) {
                player.vy = -JUMP_FORCE;
                player.onGround = false;
            }

            // apply gravity
            player.vy += GRAVITY * deltaTime;

            const unit = getUnit(canvas.width)
            const rows = canvas.height / unit;
            const platforms = getPlatforms(COLUMNS, rows);

            // collision detection
            player.x += player.vx * deltaTime;
            for (const platform of platforms) {
                if (checkCollision(player, platform)) {
                    if (player.vx > 0) {
                        // moving right, hit left side of platform
                        player.x = platform.x - player.width;
                    } else if (player.vx < 0) {
                        // moving left, hit right side of platform
                        player.x = platform.x + platform.width;
                    }
                }
            }

            player.onGround = false; // assume airborne
            player.y += player.vy * deltaTime;
            for (const platform of platforms) {
                if (checkCollision(player, platform)) {
                    if (player.vy > 0) {
                        // falling
                        player.y = platform.y - player.height;
                        player.vy = 0;
                        player.onGround = true;
                    } else if (player.vy < 0) {
                        // jumping
                        player.y = platform.y + platform.height;
                        player.vy = 0;
                    }
                }
            }
        }

        function draw() {
            const unit = getUnit(canvas.width);
            const rows = canvas.height / unit;
            const platforms = getPlatforms(COLUMNS, rows);

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
        }

        animationId = requestAnimationFrame(gameLoop); // start the loop

        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationId);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full max-w-3xl mx-auto p-4">
            <canvas ref={canvasRef} className="border-2 border-[hsl(319,25%,46%)] block bg-white w-full" />
        </div>
    );
}