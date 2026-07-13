import React, { useRef, useEffect } from 'react';
import { getRoom } from './map.jsx';
import { ASPECT_RATIO, COLUMNS } from './constants.js';
import { createInputHandler } from './input.js';
import { createPlayer, updatePlayer } from './player.js';
import { parseRoom, getAdjacentRoom, findEntryPoint, checkExitTrigger } from './rooms.js';
import { draw } from './draw.js';

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
            canvas.width = width;
            canvas.height = height;
        }
        resizeCanvas();

        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(container);

        function getUnit(canvasWidth) {
            return canvasWidth / COLUMNS;
        }

        const player = createPlayer();
        const { keys, keysPressed, attach, detach, clearFrameKeys } = createInputHandler();
        attach();

        let lastTime = performance.now();
        let playerRoom = [0, 0];
        let loadedRoom = null;
        let roomData = null;
        let roomLayout = null;
        let roomExits = null;
        let roomTeleports = null;
        let enemies = [];
        let items = [];
        let music = null;

        function gameLoop(currentTime) {
            let deltaTime = (currentTime - lastTime) / 1000;
            deltaTime = Math.min(deltaTime, 0.1); // cap deltaTime to avoid large jumps
            lastTime = currentTime;

            const unit = getUnit(canvas.width);

            if (!loadedRoom || playerRoom[0] !== loadedRoom[0] || playerRoom[1] !== loadedRoom[1]) {
                roomData = getRoom(playerRoom);
                ({ platforms: roomLayout, exits: roomExits, teleports: roomTeleports } = parseRoom(roomData.layout));
                enemies = roomData.enemies;
                items = roomData.items;
                music = roomData.music;
                loadedRoom = playerRoom;
            }

            updatePlayer(player, deltaTime, keys, keysPressed, roomLayout);

            // room transition check — lives here, not in player.js, since it's game-state, not player physics
            for (const exit of roomExits) {
                if (checkExitTrigger(player, exit)) {
                    const override = roomData.exits?.[exit.direction]?.toRoom;
                    const destCoord = override ?? getAdjacentRoom(playerRoom, exit.direction);
                    const destRoomData = getRoom(destCoord);

                    if (destRoomData) {
                        const destParsed = parseRoom(destRoomData.layout);
                        const spawn = findEntryPoint(destParsed.exits, exit.direction, player);
                        playerRoom = destCoord;
                        player.x = spawn.x;
                        player.y = spawn.y;
                        player.vx = 0;
                    }
                    break;
                }
            }

            for (const teleport of roomTeleports) {
                const centerX = player.x + player.width / 2;
                const centerY = player.y + player.height / 2;
                const inside = centerX >= teleport.x && centerX <= teleport.x + teleport.width &&
                    centerY >= teleport.y && centerY <= teleport.y + teleport.height;
                if (inside) {
                    const dest = roomData.teleports?.[teleport.id];
                    if (dest) {
                        playerRoom = dest.toRoom;
                        player.x = dest.spawnAt.x;
                        player.y = dest.spawnAt.y;
                        player.vx = 0;
                        player.vy = 0;
                    }
                    break;
                }
            }

            draw(ctx, canvas, unit, player, roomLayout, currentTime / 1000);
            clearFrameKeys();

            animationId = requestAnimationFrame(gameLoop);
        }

        animationId = requestAnimationFrame(gameLoop);

        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationId);
            detach();
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full max-w-3xl mx-auto p-4">
            <canvas ref={canvasRef} className="border-2 border-[hsl(319,25%,46%)] block bg-white w-full" />
        </div>
    );
}