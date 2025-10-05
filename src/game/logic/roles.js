export function dealRoles(playerCount) {
  const alienCount = Math.ceil(playerCount / 2);
  const humanCount = playerCount - alienCount;
  const deck = [
    ...Array(alienCount).fill("alien"),
    ...Array(humanCount).fill("human"),
  ];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
