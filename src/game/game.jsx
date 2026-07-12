import React, { useRef, useEffect } from 'react';

const ASPECT_RATIO = 16 / 9;
const GRAVITY = 1800; // pixels per second squared
const MOVE_SPEED = 300; // pixels per second
const JUMP_FORCE = 600; // pixels per second (initial upward velocity)
const GROUND_Y = 300; // temp ground level

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

        // player stats
        const player = {
            x: 100,
            y: GROUND_Y,
            width: 32,
            height: 32,
            vx: 0,
            vy: 0,
            onGround: false,
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
            if (keys['ArrowLeft']) {
                player.vx = -MOVE_SPEED;
            } else if (keys['ArrowRight']) {
                player.vx = MOVE_SPEED;
            } else {
                player.vx = 0;
            }

            // vertical movement (no mid air jumps)
            if ((keys['Space'] || keys['ArrowUp']) && player.onGround) {
                player.vy = -JUMP_FORCE;
                player.onGround = false;
            }

            // apply gravity
            player.vy += GRAVITY * deltaTime;

            // update position
            player.x += player.vx * deltaTime;
            player.y += player.vy * deltaTime;

            // temp ground collision
            if (player.y >= GROUND_Y) {
                player.y = GROUND_Y;
                player.vy = 0;
                player.onGround = true;
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // draw ground
            ctx.fillStyle = '#ccc';
            ctx.beginPath();
            ctx.moveTo(0, GROUND_Y + player.height);
            ctx.lineTo(canvas.width, GROUND_Y + player.height);
            ctx.stroke();

            // draw player
            ctx.fillStyle = 'hsl(319,25%,46%)';
            ctx.fillRect(player.x, player.y, player.width, player.height);
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