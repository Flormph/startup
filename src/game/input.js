export function createInputHandler() {
    const keys = {};
    const keysPressed = {};

    function handleKeyDown(e) {
        if (!keys[e.code]) {
            keysPressed[e.code] = true;
        }
        keys[e.code] = true;
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
    }

    function handleKeyUp(e) {
        keys[e.code] = false;
    }

    function attach() {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
    }

    function detach() {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    }

    function clearFrameKeys() {
        keysPressed['Space'] = false;
        keysPressed['ArrowUp'] = false;
        keysPressed['KeyW'] = false;
        keysPressed['ArrowDown'] = false;
        keysPressed['KeyS'] = false;
        keysPressed['KeyC'] = false;
    }

    return { keys, keysPressed, attach, detach, clearFrameKeys };
}