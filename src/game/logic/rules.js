export const MAX_TURNS = 40;

export function maxMoveFor(player) {
  if (player.role === "human") return 1;
  return player.feedBonus ? 3 : 2;
}

export function canEnter(player, coord, map) {
  const cell = map.cells[coord];
  if (!cell) return false;
  if (coord === map.humanHub || coord === map.alienHub) return false;
  return true;
}

export function humansAlive(players) {
  return players.filter((p) => p.role === "human" && p.alive && !p.escaped);
}

export function humansEscaped(players) {
  return players.filter((p) => p.role === "human" && p.escaped);
}

export function aliensAlive(players) {
  return players.filter((p) => p.role === "alien" && p.alive);
}

export function isGameOver(players, turn) {
  return humansAlive(players).length === 0 || turn >= MAX_TURNS;
}

export function isAlienWin(players) {
  return humansAlive(players).length === 0 && aliensAlive(players).length > 0;
}
