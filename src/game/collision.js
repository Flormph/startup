export function checkCollision(rectA, rectB) {
    return (
        rectA.x < rectB.x + rectB.width && // rectA to the left of rectB's right side
        rectA.x + rectA.width > rectB.x && // rectA to the right of rectB's left side
        rectA.y < rectB.y + rectB.height && // rectA above rectB's bottom side
        rectA.y + rectA.height > rectB.y // rectA below rectB's top side
    );
}