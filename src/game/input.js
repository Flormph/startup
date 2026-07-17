export function createInputHandler(onEscape) {
    const keys = {};
    const keysPressed = {};

    function handleKeyDown(e) {
        if (e.code === 'Escape' || e.code === 'KeyP') {
            onEscape?.();
            return; // don't mark Escape or P as pressed for game actions
        }
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
        keysPressed['ArrowLeft'] = false;
        keysPressed['KeyA'] = false;
        keysPressed['ArrowRight'] = false;
        keysPressed['KeyD'] = false;
    }

    return { keys, keysPressed, attach, detach, clearFrameKeys };
}