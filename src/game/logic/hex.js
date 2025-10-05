import { coordOf, letters, numbers } from "@game/logic/constants.js";

export function hexNeighbors(letter, num) {
  const letterIndex = letters.indexOf(letter);
  const numberIndex = numbers.indexOf(num);
  const even = letterIndex % 2 === 0;
  const deltas = even
    ? [ [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1] ]
    : [ [0, -1], [0, 1], [-1, 0], [1, 0], [-1, 1], [1, 1] ];

  const neighbors = [];
  for (const [dL, dN] of deltas) {
    const nextLetter = letters[letterIndex + dL];
    const nextNumber = numbers[numberIndex + dN];
    if (nextLetter && nextNumber) {
      neighbors.push(coordOf(nextLetter, nextNumber));
    }
  }
  return neighbors;
}
