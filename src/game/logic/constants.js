export const letters = Array.from({ length: 23 }, (_, i) => String.fromCharCode("A".charCodeAt(0) + i));
export const numbers = Array.from({ length: 14 }, (_, i) => String(i + 1).padStart(2, "0"));
export const coordOf = (letter, number) => `${letter}${number}`;
export const DEFAULT_SEED = 424242;
