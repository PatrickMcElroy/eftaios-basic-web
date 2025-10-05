export function edgeDistance(letterIndex, numberIndex, lettersLength, numbersLength) {
  return Math.min(letterIndex, lettersLength - 1 - letterIndex, numberIndex, numbersLength - 1 - numberIndex);
}

export function euclideanDistance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}
