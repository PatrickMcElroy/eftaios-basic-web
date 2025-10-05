const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const HEX_RADIUS = 10;

export const directions = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export const escapePods = [
  { axial: { q: 0, r: -HEX_RADIUS }, status: 'Ready' },
  { axial: { q: HEX_RADIUS, r: -HEX_RADIUS }, status: 'Ready' },
  { axial: { q: -HEX_RADIUS, r: 0 }, status: 'Damaged' },
  { axial: { q: 0, r: HEX_RADIUS }, status: 'Offline' },
];

export const legendEntries = [
  { type: 'command', label: 'Command Center' },
  { type: 'safe', label: 'Quiet Sector' },
  { type: 'danger', label: 'Dangerous Sector' },
  { type: 'hatch', label: 'Access Hatch' },
  { type: 'escape', label: 'Escape Pod' },
];

export const crew = [
  { id: 'ripley', name: 'Ripley', role: 'Human', location: 'K11' },
  { id: 'dallas', name: 'Dallas', role: 'Human', location: 'M12' },
  { id: 'lambert', name: 'Lambert', role: 'Human', location: 'J10' },
  { id: 'kane', name: 'Kane', role: 'Human', location: 'L09' },
  { id: 'ash', name: 'Ash', role: 'Android', location: 'H12' },
  { id: 'alien-1', name: 'Alien 1', role: 'Alien', location: 'N08' },
  { id: 'alien-2', name: 'Alien 2', role: 'Alien', location: 'G13' },
  { id: 'alien-3', name: 'Alien 3', role: 'Alien', location: 'P14' },
];

export function axialToId(q, r) {
  const columnIndex = q + HEX_RADIUS;
  const rowIndex = r + HEX_RADIUS;
  const letter = LETTERS[columnIndex] ?? '?';
  const row = String(rowIndex + 1).padStart(2, '0');
  return `${letter}${row}`;
}

export function generateHexBoard() {
  const tiles = [];
  const escapeIds = new Set(escapePods.map((pod) => axialToId(pod.axial.q, pod.axial.r)));

  for (let q = -HEX_RADIUS; q <= HEX_RADIUS; q += 1) {
    const rMin = Math.max(-HEX_RADIUS, -q - HEX_RADIUS);
    const rMax = Math.min(HEX_RADIUS, -q + HEX_RADIUS);

    for (let r = rMin; r <= rMax; r += 1) {
      const s = -q - r;
      const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      let type = 'safe';

      if (distance === HEX_RADIUS) {
        type = 'void';
      } else if (escapeIds.has(axialToId(q, r))) {
        type = 'escape';
      } else if (distance <= 2) {
        type = 'command';
      } else if (distance >= HEX_RADIUS - 2) {
        type = 'hatch';
      } else if ((Math.abs(q) + Math.abs(r)) % 3 === 0) {
        type = 'danger';
      }

      tiles.push({
        id: axialToId(q, r),
        q,
        r,
        type,
        distance,
      });
    }
  }

  return tiles.sort((a, b) => {
    if (a.r === b.r) {
      return a.q - b.q;
    }
    return a.r - b.r;
  });
}

export function findTileById(tiles, id) {
  return tiles.find((tile) => tile.id === id);
}

export function neighborsOf(tile) {
  return directions.map(({ q, r }) => ({ q: tile.q + q, r: tile.r + r }));
}

export function axialKey(q, r) {
  return `${q},${r}`;
}
