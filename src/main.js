import {
  crew,
  escapePods,
  legendEntries,
  generateHexBoard,
  axialToId,
  neighborsOf,
  axialKey,
} from './data.js';

const boardElement = document.querySelector('[data-board]');
const hoverInfo = document.querySelector('[data-hover-info]');
const legendContainer = document.querySelector('[data-legend]');
const escapeContainer = document.querySelector('[data-escape-pods]');
const rosterList = document.querySelector('[data-roster]');
const activeSummary = document.querySelector('[data-active-summary]');
const activePlayerIndicator = document.querySelector('[data-active-player]');

const NS = 'http://www.w3.org/2000/svg';
const HEX_SIZE = 32;
const tiles = generateHexBoard();
const axialIndex = new Map(tiles.map((tile) => [axialKey(tile.q, tile.r), tile]));
const tileElements = new Map();
const tileById = new Map(tiles.map((tile) => [tile.id, tile]));

const occupantsByTile = new Map();
crew.forEach((member) => {
  if (!occupantsByTile.has(member.location)) {
    occupantsByTile.set(member.location, []);
  }
  occupantsByTile.get(member.location).push(member);
});

const typeLabels = {
  void: 'Exterior Hull',
  safe: 'Quiet Sector',
  danger: 'Dangerous Sector',
  hatch: 'Access Hatch',
  escape: 'Escape Pod',
  command: 'Command Center',
};

const activePlayer = crew.find((member) => member.role === 'Human') ?? crew[0];
if (activePlayerIndicator) {
  activePlayerIndicator.textContent = `Active: ${activePlayer.name}`;
}

function axialToPixel(q, r, size) {
  const x = size * 1.5 * q;
  const y = size * Math.sqrt(3) * (r + q / 2);
  return { x, y };
}

function polygonPoints(cx, cy, size) {
  const points = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i);
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ');
}

function createHexGroup(tile) {
  const { x, y } = axialToPixel(tile.q, tile.r, HEX_SIZE);
  const group = document.createElementNS(NS, 'g');
  group.classList.add('hex-group');
  group.dataset.id = tile.id;
  group.dataset.type = tile.type;
  group.dataset.q = tile.q;
  group.dataset.r = tile.r;
  if (tile.type !== 'void') {
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'button');
    group.setAttribute('aria-label', `${tile.id}, ${typeLabels[tile.type] ?? 'Sector'}`);
  }

  const polygon = document.createElementNS(NS, 'polygon');
  polygon.setAttribute('points', polygonPoints(x, y, HEX_SIZE));

  group.append(polygon);

  if (tile.type !== 'void') {
    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', x.toFixed(2));
    label.setAttribute('y', (y + 4).toFixed(2));
    label.setAttribute('text-anchor', 'middle');
    label.textContent = tile.id;
    group.append(label);
  }
  tileElements.set(tile.id, group);
  boardElement.appendChild(group);

  if (tile.type !== 'void') {
    group.addEventListener('pointerenter', () => setHover(tile.id));
    group.addEventListener('pointerleave', (event) => {
      if (event.relatedTarget && group.contains(event.relatedTarget)) {
        return;
      }
      clearHover();
    });
    group.addEventListener('click', () => setSelected(tile.id));
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setSelected(tile.id);
      }
    });
  }

  return { ...tile, x, y };
}

const positionedTiles = tiles.map(createHexGroup);
const xs = positionedTiles.map((tile) => tile.x);
const ys = positionedTiles.map((tile) => tile.y);
const margin = HEX_SIZE * 3;
const minX = Math.min(...xs) - margin;
const maxX = Math.max(...xs) + margin;
const minY = Math.min(...ys) - margin;
const maxY = Math.max(...ys) + margin;

boardElement.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
boardElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

function setHover(tileId) {
  if (!tileId) return;
  const tile = tileById.get(tileId);
  if (!tile) return;

  clearHover();
  hoveredTiles.current = [tileId];

  const element = tileElements.get(tileId);
  if (element) {
    element.classList.add('is-hovered');
  }

  const neighbors = neighborsOf(tile)
    .map(({ q, r }) => axialIndex.get(axialKey(q, r)))
    .filter(Boolean);

  neighbors.forEach((neighbor) => {
    const neighborElement = tileElements.get(neighbor.id);
    if (neighborElement) {
      neighborElement.classList.add('is-adjacent');
      hoveredTiles.current.push(neighbor.id);
    }
  });

  const occupantSummary = describeOccupants(tileId);
  const label = typeLabels[tile.type] ?? 'Sector';
  hoverInfo.textContent = occupantSummary
    ? `${tile.id} · ${label} · ${occupantSummary}`
    : `${tile.id} · ${label}`;
}

const hoveredTiles = { current: [] };

function clearHover() {
  hoveredTiles.current.forEach((id) => {
    const element = tileElements.get(id);
    if (element) {
      element.classList.remove('is-hovered', 'is-adjacent');
    }
  });
  hoveredTiles.current = [];
  hoverInfo.textContent = '—';
}

let selectedTileId = null;

function setSelected(tileId) {
  if (selectedTileId === tileId) {
    return;
  }

  if (selectedTileId) {
    const previous = tileElements.get(selectedTileId);
    if (previous) {
      previous.classList.remove('is-selected');
    }
  }

  selectedTileId = tileId;
  const tile = tileById.get(tileId);
  const element = tileElements.get(tileId);
  if (element) {
    element.classList.add('is-selected');
  }

  if (!tile) {
    activeSummary.textContent = 'Select a tile to inspect adjacency and occupants.';
    return;
  }

  const label = typeLabels[tile.type] ?? 'Sector';
  const occupantSummary = describeOccupants(tileId, { verbose: true });
  const neighbors = neighborsOf(tile)
    .map(({ q, r }) => axialIndex.get(axialKey(q, r)))
    .filter(Boolean);

  const neighborList = neighbors.length
    ? neighbors.map((neighbor) => `<span class="summary-badge">${neighbor.id}</span>`).join(' ')
    : '—';

  activeSummary.innerHTML = `
    <p class="summary-line">Tile <strong>${tile.id}</strong> · ${label}</p>
    ${occupantSummary}
    <p class="summary-line"><strong>Adjacent:</strong> ${neighborList}</p>
  `;
}

function describeOccupants(tileId, { verbose = false } = {}) {
  const occupants = occupantsByTile.get(tileId);
  if (!occupants || occupants.length === 0) {
    return verbose ? '<p class="summary-line">No known occupants.</p>' : '';
  }

  if (!verbose) {
    return occupants.map((entry) => entry.name).join(', ');
  }

  const details = occupants
    .map(
      (entry) =>
        `<span class="summary-badge summary-badge--${entry.role.toLowerCase()}">${entry.name}</span>`
    )
    .join(' ');

  return `<p class="summary-line"><strong>Occupants:</strong> ${details}</p>`;
}

function createLegend() {
  const template = document.getElementById('legend-item-template');
  legendEntries.forEach((entry) => {
    const fragment = template.content.cloneNode(true);
    const swatch = fragment.querySelector('.legend-swatch');
    const label = fragment.querySelector('.legend-label');
    swatch.dataset.type = entry.type;
    label.textContent = entry.label;
    legendContainer.appendChild(fragment);
  });
}

function createEscapePods() {
  const template = document.getElementById('escape-pod-template');
  escapePods.forEach((pod, index) => {
    const fragment = template.content.cloneNode(true);
    const label = fragment.querySelector('.pod-label');
    const status = fragment.querySelector('.pod-status');
    const tileId = axialToId(pod.axial.q, pod.axial.r);
    label.textContent = `Pod ${index + 1} · ${tileId}`;
    status.textContent = pod.status;
    escapeContainer.appendChild(fragment);
  });
}

function createRoster() {
  crew.forEach((member) => {
    const item = document.createElement('li');
    item.classList.add('roster-item');

    const avatar = document.createElement('div');
    avatar.classList.add('roster-avatar');
    avatar.textContent = member.name[0];

    const name = document.createElement('div');
    name.classList.add('roster-name');
    name.textContent = member.name;

    const role = document.createElement('div');
    role.classList.add('roster-role');
    role.textContent = `${member.role} · ${member.location}`;

    item.append(avatar, name, role);
    rosterList.appendChild(item);
  });
}

function addTokens() {
  crew.forEach((member) => {
    const tile = tileById.get(member.location);
    if (!tile) {
      return;
    }
    const tokenGroup = document.createElementNS(NS, 'g');
    tokenGroup.classList.add('token');
    tokenGroup.classList.add(
      member.role.toLowerCase() === 'alien' ? 'token--alien' : 'token--human'
    );
    const { x, y } = axialToPixel(tile.q, tile.r, HEX_SIZE);
    tokenGroup.setAttribute('transform', `translate(${x}, ${y})`);

    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('r', (HEX_SIZE * 0.52).toFixed(2));
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');

    const label = document.createElementNS(NS, 'text');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.setAttribute('y', '3');
    label.textContent = member.name[0];

    tokenGroup.append(circle, label);
    boardElement.appendChild(tokenGroup);
  });
}

createLegend();
createEscapePods();
createRoster();
addTokens();

setSelected(crew[0]?.location ?? null);

boardElement.addEventListener('mouseleave', clearHover);
