import React, { useRef, useEffect } from 'react';

const ASPECT_RATIO = 16 / 9;

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

        function gameLoop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            animationId = requestAnimationFrame(gameLoop);
        }
        gameLoop();

        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full max-w-3xl mx-auto p-4">
            <canvas ref={canvasRef} className="border-2 border-[hsl(319,25%,46%)] block bg-white w-full" />
        </div>
    );
}