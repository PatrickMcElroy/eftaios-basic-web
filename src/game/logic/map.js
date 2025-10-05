import { coordOf, DEFAULT_SEED, letters, numbers } from "@game/logic/constants.js";
import { mulberry32 } from "@game/logic/rng.js";
import { edgeDistance, euclideanDistance } from "@lib/math.js";

export function buildMap(seed = DEFAULT_SEED) {
  const rnd = mulberry32(seed);
  const cells = {};

  const centerLetterIndex = Math.floor(letters.length / 2);
  const centerNumberIndex = Math.floor(numbers.length / 2);
  const rx = 9.5;
  const ry = 6.0;

  for (let letterIndex = 0; letterIndex < letters.length; letterIndex++) {
    for (let numberIndex = 0; numberIndex < numbers.length; numberIndex++) {
      const x = (letterIndex - centerLetterIndex) / rx;
      const y = (numberIndex - centerNumberIndex) / ry;
      const inside = x * x + y * y <= 1.0 + (rnd() * 0.08 - 0.04);
      const id = coordOf(letters[letterIndex], numbers[numberIndex]);
      if (!inside) continue;

      cells[id] = {
        id,
        type: "dangerous",
      };
    }
  }

  const humanHub = coordOf(letters[4], numbers[centerNumberIndex]);
  const alienHub = coordOf(letters[letters.length - 5], numbers[centerNumberIndex]);
  if (cells[humanHub]) cells[humanHub].type = "human";
  if (cells[alienHub]) cells[alienHub].type = "alien";

  const cellKeys = Object.keys(cells).filter((id) => cells[id].type === "dangerous");
  const silentTarget = Math.floor(cellKeys.length * 0.3);
  for (let i = 0; i < silentTarget; i++) {
    const pick = cellKeys[Math.floor(rnd() * cellKeys.length)];
    if (pick && cells[pick].type === "dangerous") {
      cells[pick].type = "silent";
    }
  }

  const pods = [];
  const farCells = Object.keys(cells).filter((id) => cells[id].type !== "human" && cells[id].type !== "alien");
  const podScore = (id) => {
    const letterIndex = letters.indexOf(id[0]);
    const numberIndex = numbers.indexOf(id.slice(1));
    const border = edgeDistance(letterIndex, numberIndex, letters.length, numbers.length);
    const humanDistance = euclideanDistance(
      letterIndex,
      numberIndex,
      letters.indexOf(humanHub[0]),
      numbers.indexOf(humanHub.slice(1))
    );
    const alienDistance = euclideanDistance(
      letterIndex,
      numberIndex,
      letters.indexOf(alienHub[0]),
      numbers.indexOf(alienHub.slice(1))
    );
    const silentBonus = cells[id].type === "silent" ? 0.4 : 0;
    return -border + humanDistance + alienDistance + silentBonus;
  };

  farCells.sort((a, b) => podScore(b) - podScore(a));
  for (const id of farCells) {
    if (pods.length >= 4) break;
    if (cells[id].type === "silent" || cells[id].type === "dangerous") {
      cells[id].type = "pod";
      pods.push(id);
    }
  }

  return { cells, humanHub, alienHub, pods };
}
