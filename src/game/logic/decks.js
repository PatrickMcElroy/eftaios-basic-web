import { DEFAULT_SEED } from "@game/logic/constants.js";
import { mulberry32 } from "@game/logic/rng.js";

export function createDefaultDangerCards() {
  const cards = [];
  const nSilence = 28;
  const nNoiseYou = 22;
  const nNoiseAny = 10;
  for (let i = 0; i < nSilence; i++) cards.push({ kind: "silence" });
  for (let i = 0; i < nNoiseYou; i++) cards.push({ kind: "noise-you" });
  for (let i = 0; i < nNoiseAny; i++) cards.push({ kind: "noise-any" });
  return cards;
}

export function buildDangerDeck(seed = DEFAULT_SEED, factory = createDefaultDangerCards) {
  const rnd = mulberry32(seed ^ 0xBEEF);
  const cards = factory().slice();
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function createDefaultEscapePodCards() {
  return [ { kind: "green" }, { kind: "green" }, { kind: "red" }, { kind: "red" } ];
}

export function buildEscapePodDeck(seed = DEFAULT_SEED, factory = createDefaultEscapePodCards) {
  const rnd = mulberry32(seed ^ 0xFACE);
  const cards = factory().slice();
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
