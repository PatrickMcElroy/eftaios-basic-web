import { mulberry32 } from "@game/logic/rng.js";
import { DEFAULT_SEED } from "@game/logic/constants.js";

export const HUMAN_CHARACTERS = [
  {
    id: "captain",
    role: "human",
    name: "Captain",
    rank: "Officer",
    ability: "Skips the first Dangerous Sector draw encountered.",
  },
  {
    id: "pilot",
    role: "human",
    name: "Pilot",
    rank: "Officer",
    ability: "Once per game announces noise in two sectors after a draw.",
  },
  {
    id: "psychologist",
    role: "human",
    name: "Psychologist",
    rank: "Scientist",
    ability: "Starts in the Alien sector instead of the Human hub.",
  },
  {
    id: "soldier",
    role: "human",
    name: "Soldier",
    rank: "Security",
    ability: "May perform a single attack just like an Alien.",
  },
  {
    id: "executive",
    role: "human",
    name: "Executive Officer",
    rank: "Officer",
    ability: "Can remain still for one turn without revealing it.",
  },
  {
    id: "copilot",
    role: "human",
    name: "Co-Pilot",
    rank: "Officer",
    ability: "Can teleport to the Human sector once per game.",
  },
  {
    id: "engineer",
    role: "human",
    name: "Engineer",
    rank: "Technical",
    ability: "Draws two Escape Pod cards and keeps the preferred one.",
  },
  {
    id: "medic",
    role: "human",
    name: "Medic",
    rank: "Medical",
    ability: "Forces another player to reveal their identity once.",
  },
];

export const ALIEN_CHARACTERS = [
  {
    id: "blink",
    role: "alien",
    name: "Blink Alien",
    rank: "Eldritch",
    ability: "May use Teleport items as if Human.",
  },
  {
    id: "silent",
    role: "alien",
    name: "Silent Alien",
    rank: "Eldritch",
    ability: "May use Sedatives items as if Human.",
  },
  {
    id: "surge",
    role: "alien",
    name: "Surge Alien",
    rank: "Eldritch",
    ability: "May use Adrenaline items as if Human.",
  },
  {
    id: "brute",
    role: "alien",
    name: "Brute Alien",
    rank: "Eldritch",
    ability: "Immune to all attacks; must reveal identity when targeted.",
  },
  {
    id: "invisible",
    role: "alien",
    name: "Invisible Alien",
    rank: "Eldritch",
    ability: "Immune to Sensor/Spotlight; reveals identity instead.",
  },
  {
    id: "lurking",
    role: "alien",
    name: "Lurking Alien",
    rank: "Eldritch",
    ability: "May attack without moving instead of taking a step.",
  },
  {
    id: "fast",
    role: "alien",
    name: "Fast Alien",
    rank: "Eldritch",
    ability: "May move up to three sectors on first turn.",
  },
  {
    id: "psychic",
    role: "alien",
    name: "Psychic Alien",
    rank: "Eldritch",
    ability: "Silence draws behave as Noise in Any Sector.",
  },
];

export function dealCharacters(playerCount, seed = DEFAULT_SEED) {
  const alienCount = Math.ceil(playerCount / 2);
  const humanCount = playerCount - alienCount;

  if (alienCount > ALIEN_CHARACTERS.length || humanCount > HUMAN_CHARACTERS.length) {
    throw new Error("Not enough unique character sheets for the requested player count.");
  }

  const rnd = mulberry32(seed ^ 0xABCD);
  const humans = HUMAN_CHARACTERS.slice();
  const aliens = ALIEN_CHARACTERS.slice();

  function draw(pool) {
    const index = Math.floor(rnd() * pool.length);
    const [character] = pool.splice(index, 1);
    return character;
  }

  const chosen = [];
  for (let i = 0; i < alienCount; i++) {
    chosen.push(draw(aliens));
  }
  for (let i = 0; i < humanCount; i++) {
    chosen.push(draw(humans));
  }

  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }

  return chosen;
}
