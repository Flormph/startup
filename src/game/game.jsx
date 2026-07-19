import React, { useRef, useEffect } from 'react';
import { getRoom } from './map.jsx';
import { ASPECT_RATIO, COLUMNS } from './constants.js';
import { createInputHandler } from './input.js';
import { createPlayer, updatePlayer } from './player.js';
import { parseRoom, getAdjacentRoom, findEntryPoint, checkExitTrigger } from './rooms.js';
import { draw } from './draw.js';
import { loadSprites, isSpriteReady, getSpriteSheet } from './sprites.js';
import { StartMenu } from './start-menu.jsx';
import { PauseMenu } from './pause-menu.jsx';
import { SettingsMenu } from './settings-menu.jsx';

export function Game() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const canvasWrapperRef = useRef(null);

    const [gameState, setGameState] = React.useState('start'); // 'start', 'playing', 'paused', 'settings', 'gameover'
    const gameStateRef = useRef(gameState); // To keep track of the current game state in the animation frame
    const prevGameStateRef = useRef('playing'); // To track the previous game state for resuming

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    function openSettings() {
        prevGameStateRef.current = gameStateRef.current;
        setGameState('settings');
    }

    function togglePause() { // Toggle between 'playing' and 'paused'
        if (gameStateRef.current === 'playing') setGameState('paused');
        else if (gameStateRef.current === 'paused') setGameState('playing');
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const wrapper = canvasWrapperRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;

        function resizeCanvas() {
            const availableWidth = container.clientWidth;
            const availableHeight = window.innerHeight - container.getBoundingClientRect().top; // Subtract the top offset of the container from the window height to get the available height

            // fit within whichever dimension is the binding constraint
            let width = availableWidth;
            let height = width / ASPECT_RATIO;

            if (height > availableHeight) {
                height = availableHeight;
                width = height * ASPECT_RATIO;
            }

            wrapper.style.width = `${width}px`;
            wrapper.style.height = `${height}px`;
            canvas.width = width;
            canvas.height = height;
        }
        resizeCanvas(); // Initial resize
        window.addEventListener('resize', resizeCanvas);

        function getUnit(canvasWidth) {
            return canvasWidth / COLUMNS;
        }

        loadSprites('Axolotl_Player.png', 'Axolotl_Player.json');

        const { keys, keysPressed, attach, detach, clearFrameKeys } = createInputHandler(togglePause);
        attach();

        let players = [];
        let lastTime = performance.now();
        let playerArea = 'Shallows'; // current area name
        let playerRoom = [0, 0];
        let loadedRoom = null;
        let roomData = null;
        let roomLayout = null;
        let roomExits = null;
        let enemies = [];
        let items = [];
        let music = null;
        let teleports = [];

        function gameLoop(currentTime) {
            let deltaTime = (currentTime - lastTime) / 1000;
            deltaTime = Math.min(deltaTime, 0.1); // cap deltaTime to avoid large jumps
            lastTime = currentTime;

            const unit = getUnit(canvas.width);
            const isPlaying = gameStateRef.current === 'playing';

            if (!loadedRoom || playerRoom[0] !== loadedRoom[0] || playerRoom[1] !== loadedRoom[1]) {
                roomData = getRoom(playerArea, playerRoom);
                const parsed = parseRoom(roomData.layout);
                roomLayout = parsed.platforms;
                roomExits = parsed.exits;

                enemies = parsed.enemies.map((pos, i) => ({ ...pos, ...roomData.enemies[i] })); // Assign unique IDs to enemies
                items = parsed.items.map((pos, i) => ({ ...pos, ...roomData.items[i] })); // Assign unique IDs to items
                teleports = parsed.teleports.map((pos, i) => ({ ...pos, ...roomData.teleports[i] })); // Assign unique IDs to teleports

                if (players.length === 0) { // TODO: will probably break when multiple players are added later
                    players = parsed.players.map((pos, i) => {
                        const p = createPlayer(); // real player object, all physics fields present
                        p.x = pos.x;
                        p.y = pos.y;
                        p.id = roomData.players[i]?.id ?? i; // fallback to index if no id provided
                        return p;
                    });
                }

                music = roomData.music;
                loadedRoom = playerRoom;
            }

            if (isPlaying) {
                for (const player of players) {
                    updatePlayer(player, deltaTime, keys, keysPressed, roomLayout);
                }


                // room transition check — lives here, not in player.js, since it's game-state, not player physics
                for (const player of players) {
                    for (const exit of roomExits) {
                        if (checkExitTrigger(player, exit)) {
                            const override = roomData.exits?.[exit.direction]?.targetRoom;
                            const destCoord = override ? override.split(',').map(Number) : getAdjacentRoom(playerRoom, exit.direction);
                            const destRoomData = getRoom(playerArea, destCoord);

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
                }

                for (const player of players) {
                    for (const teleport of teleports) {
                        const centerX = player.x + player.width / 2;
                        const centerY = player.y + player.height / 2;
                        const inside = centerX >= teleport.x && centerX <= teleport.x + teleport.width &&
                            centerY >= teleport.y && centerY <= teleport.y + teleport.height;
                        if (inside) {
                            playerRoom = teleport.toRoom;
                            player.x = teleport.spawnAt.x;
                            player.y = teleport.spawnAt.y;
                            player.vx = 0;
                            player.vy = 0;
                            break;
                        }

                    }
                }
            }
            for (const player of players) {
                draw(ctx, canvas, unit, player, roomLayout, currentTime / 1000, deltaTime);
            }
            clearFrameKeys();

            animationId = requestAnimationFrame(gameLoop);
        }

        animationId = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationId);
            detach();
        };
    }, []);

    return (
        <div ref={containerRef} className="relative w-full mx-auto p-4 flex justify-center items-center">
            <div ref={canvasWrapperRef} className="relative @container">
                <canvas ref={canvasRef} className="border-2 border-[hsl(319,25%,46%)] block bg-white w-full h-full" />

                {gameState === 'start' && (
                    <StartMenu
                        onStart={() => setGameState('playing')}
                        onSettings={() => { prevGameStateRef.current = 'start'; setGameState('settings'); }}
                    />
                )}

                {gameState === 'paused' && (
                    <PauseMenu
                        onResume={() => setGameState('playing')}
                        onSettings={() => { prevGameStateRef.current = 'paused'; setGameState('settings'); }}
                        onQuit={() => setGameState('start')}
                    />
                )}

                {gameState === 'settings' && (
                    <SettingsMenu
                        onBack={() => setGameState(prevGameStateRef.current)}
                    />
                )}
            </div>
        </div>
    );
}