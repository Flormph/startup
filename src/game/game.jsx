import React, { useRef, useEffect } from 'react';
import { getRoom } from "./map.jsx"

const ASPECT_RATIO = 16 / 9;
const GRAVITY = 30; // units per second squared
const MOVE_SPEED = 10; // units per second
const JUMP_FORCE = 16; // units per second (initial upward velocity)
const COLUMNS = 30; // how many units wide the visible world is
const COYOTE_TIME = 0.15; // seconds of grace period after leaving the ground
const SPRINT_JUMP_MULT = 1.2; // how much higher the player jumps when sprinting
const SPRINT_TIME = 1.5; // how many seconds until sprinting
const SPRINT_MULT = 1.5 // how much faster sprinting is than walking
const EXIT_CHARS = { L: 'left', R: 'right', U: 'up', D: 'down' }; // characters representing room exits in the level layout

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
            width: .8, // 0.6 units wide
            height: 1.8, // 0.8 units tall
            vx: 0,
            vy: 0,
            onGround: false,
            coyoteTimer: 0,
            sprintTimer: 0,
        }

        // input handling
        const keys = {};
        const keysPressed = {};

        function handleKeyDown(e) {
            if (!keys[e.code]) {
                keysPressed[e.code] = true; // only true on first frame of key press
            }
            keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        }

        // handle key up events
        function handleKeyUp(e) { keys[e.code] = false; }
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);


        // helper functions

        function checkCollision(rectA, rectB) { // checks if two rectangles are colliding
            return (
                rectA.x < rectB.x + rectB.width &&
                rectA.x + rectA.width > rectB.x &&
                rectA.y < rectB.y + rectB.height &&
                rectA.y + rectA.height > rectB.y
            );
        }

        function parseRoom(rows, tileSize = 1) { // parse a level layout into an array of room objects
            const platforms = []; // array to store platform objects
            const exits = []; // array to store room exits
            const teleports = []; // array to store teleport points

            rows.forEach((row, rowIndex) => {
                row.split('').forEach((char, colIndex) => {
                    const x = colIndex * tileSize;
                    const y = rowIndex * tileSize;

                    if (char === '#') {
                        platforms.push({ x: colIndex * tileSize, y: rowIndex * tileSize, width: tileSize, height: tileSize });
                    } else if (EXIT_CHARS[char]) {
                        exits.push({ x, y, direction: EXIT_CHARS[char], width: tileSize, height: tileSize });
                    } else if (char >= '1' && char <= '9') {
                        teleports.push({ x, y, width: tileSize, height: tileSize, id: char });
                    }
                });
            });
            return { platforms, exits, teleports };
        }

        function getAdjacentRoom(room, direction) { // gets the coordinates of the room adjacent to the given room in the specified direction
            switch (direction) {
                case 'up': return [room[0], room[1] - 1];
                case 'down': return [room[0], room[1] + 1];
                case 'left': return [room[0] - 1, room[1]];
                case 'right': return [room[0] + 1, room[1]];
            }
        }

        function getOppositeDirection(direction) { // gets the opposite direction of the given direction
            switch (direction) {
                case 'up': return 'down';
                case 'down': return 'up';
                case 'left': return 'right';
                case 'right': return 'left';
            }
        }

        function findEntryPoint(destExits, travelDirection) { // finds the entry point in the destination room based on the travel direction
            const entryDirection = getOppositeDirection(travelDirection);
            const match = destExits.find((e) => e.direction === entryDirection);
            if (!match) return { x: 2, y: 2 }; // fallback if no matching entry point is found

            switch (entryDirection) {
                case 'left':
                    return { x: match.x + 1.1, y: player.y }; // vertical position carries over unchanged
                case 'right':
                    return { x: match.x - player.width - 0.1, y: player.y };
                case 'up':
                    return { x: player.x, y: match.y + 1.1 }; // horizontal position carries over unchanged
                case 'down':
                    return { x: player.x, y: match.y - player.height - 0.1 };
            }
        }

        function checkExitTrigger(player, exit) { // checks if the player has triggered any exit in the current room
            const centerX = player.x + player.width / 2;
            const centerY = player.y + player.height / 2;

            const insideExit =
                centerX >= exit.x && centerX <= exit.x + exit.width &&
                centerY >= exit.y && centerY <= exit.y + exit.height;

            if (!insideExit) return false;

            switch (exit.direction) {
                case 'left': return player.vx < 0;
                case 'right': return player.vx > 0;
                case 'up': return player.vy < 0;
                case 'down': return player.vy > 0;
                default: return false;
            }
            return insideExit;
        }

        // initialize game state variables

        let lastTime = performance.now(); // game loop with delta time
        let playerRoom = [0, 0]; // player's room coordinate TODO: update when player moves between rooms
        let loadedRoom = null; // room currently loaded
        let roomData = null; // data for the current level
        let roomLayout = null; // parsed layout of the current level
        let roomExits = null; // exits in the current room
        let roomTeleports = null; // teleport points in the current room
        let enemies = []; // enemies in the current level
        let items = []; // items in the current level
        let music = null; // music for the current level

        function gameLoop(currentTime) {
            const deltaTime = (currentTime - lastTime) / 1000; // convert to seconds
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

            update(deltaTime, { platforms: roomLayout, exits: roomExits, teleports: roomTeleports });
            draw(unit, { platforms: roomLayout, exits: roomExits, teleports: roomTeleports });

            keysPressed['Space'] = false;
            keysPressed['ArrowUp'] = false;
            keysPressed['KeyW'] = false;

            animationId = requestAnimationFrame(gameLoop);
        }

        function update(deltaTime, { platforms, exits, teleports }) {
            // horizontal movement
            if (keys['ArrowLeft'] || keys['KeyA']) {
                if (player.sprintTimer < SPRINT_TIME) {
                    player.vx = -MOVE_SPEED;
                    player.sprintTimer += deltaTime;
                } else {
                    player.vx = -MOVE_SPEED * SPRINT_MULT
                }
            } else if (keys['ArrowRight'] || keys['KeyD']) {
                if (player.sprintTimer < SPRINT_TIME) {
                    player.vx = MOVE_SPEED;
                    player.sprintTimer += deltaTime;
                } else {
                    player.vx = MOVE_SPEED * SPRINT_MULT
                }
            } else {
                player.vx = 0;
                player.sprintTimer = 0;
            }

            if (player.onGround) {
                player.coyoteTimer = COYOTE_TIME;
            } else {
                player.coyoteTimer -= deltaTime;
            }

            // vertical movement (no mid air jumps)
            if ((keysPressed['Space'] || keysPressed['ArrowUp'] || keysPressed['KeyW']) && player.coyoteTimer > 0) {
                if (player.sprintTimer >= SPRINT_TIME) {
                    player.vy = -JUMP_FORCE * SPRINT_JUMP_MULT;
                } else {
                    player.vy = -JUMP_FORCE;
                }
                player.onGround = false;
                player.coyoteTimer = 0; // prevents spam jump
            }

            // apply gravity
            player.vy += GRAVITY * deltaTime;

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

            // exit detection
            for (const exit of exits) {
                if (checkExitTrigger(player, exit)) {
                    const override = roomData.exits?.[exit.direction]?.toRoom; // check if there's an override for the exit's destination room
                    const destCoord = override ?? getAdjacentRoom(playerRoom, exit.direction); // if no override, go to adjacent room
                    const destRoomData = getRoom(destCoord);

                    if (destRoomData) {
                        const destParsed = parseRoom(destRoomData.layout);
                        const spawn = findEntryPoint(destParsed.exits, exit.direction);
                        playerRoom = destCoord; // update the current room
                        player.x = spawn.x;
                        player.y = spawn.y;
                        player.vx = 0;
                    }
                    return;
                }
            }

            // teleport detection
            for (const teleport of teleports) {
                const centerX = player.x + player.width / 2;
                const centerY = player.y + player.height / 2;
                const inside = centerX >= teleport.x && centerX <= teleport.x + teleport.width &&
                    centerY >= teleport.y && centerY <= teleport.y + teleport.height;
                if (inside) {
                    const dest = roomData.teleports?.[teleport.id];
                    if (dest) {
                        playerRoom = dest.toRoom; // update the current room
                        player.x = dest.spawnAt.x;
                        player.y = dest.spawnAt.y;
                        player.vx = 0;
                        player.vy = 0;
                    }
                    return;
                }
            }
        }

        function draw(unit, { platforms, exits, teleports }) {
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