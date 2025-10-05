import { useMemo, useState } from "react";
import { buildDangerDeck, buildEscapePodDeck } from "@game/logic/decks.js";
import { dealRoles } from "@game/logic/roles.js";
import { buildMap } from "@game/logic/map.js";
import { hexNeighbors } from "@game/logic/hex.js";
import { DEFAULT_SEED } from "@game/logic/constants.js";
import {
  canEnter,
  humansAlive,
  humansEscaped as computeHumansEscaped,
  isAlienWin,
  isGameOver,
  maxMoveFor,
} from "@game/logic/rules.js";

export function useGameEngine() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const map = useMemo(() => buildMap(seed), [seed]);
  const [dangerDeck, setDangerDeck] = useState(() => buildDangerDeck(seed));
  const [podDeck, setPodDeck] = useState(() => buildEscapePodDeck(seed));

  const [players, setPlayers] = useState([]);
  const [turn, setTurn] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [log, setLog] = useState([]);

  function appendLog(message) {
    setLog((entries) => entries.concat([message]));
  }

  function resetAll(newSeed = DEFAULT_SEED) {
    setSeed(newSeed);
    setLog([]);
    setTurn(0);
    setActiveIdx(0);
    setPlayers([]);
    setDangerDeck(buildDangerDeck(newSeed));
    setPodDeck(buildEscapePodDeck(newSeed));
  }

  function addPlayers(names) {
    const roles = dealRoles(names.length);
    const nextPlayers = names.map((name, index) => ({
      id: `P${index + 1}`,
      name: name.trim() || `Player ${index + 1}`,
      role: roles[index],
      alive: true,
      feedBonus: false,
      position: roles[index] === "human" ? map.humanHub : map.alienHub,
      escaped: false,
    }));
    setPlayers(nextPlayers);
    appendLog(`\u{1F680} New game: ${nextPlayers.length} players. Roles dealt secretly.`);
  }

  function neighborsOf(coord) {
    const letter = coord[0];
    const number = coord.slice(1);
    return hexNeighbors(letter, number).filter((candidate) => map.cells[candidate]);
  }

  function legalStepsFrom(player, coord, depth) {
    const limit = Math.min(depth ?? maxMoveFor(player), 3);
    let frontier = [coord];
    const visited = new Set([coord]);
    const results = new Set();

    for (let steps = 0; steps < limit; steps++) {
      const nextFrontier = [];
      for (const current of frontier) {
        for (const neighbor of neighborsOf(current)) {
          if (visited.has(neighbor)) continue;
          visited.add(neighbor);
          if (canEnter(player, neighbor, map)) {
            results.add(neighbor);
          }
          nextFrontier.push(neighbor);
        }
      }
      frontier = nextFrontier;
    }

    return Array.from(results);
  }

  function drawDanger() {
    if (dangerDeck.length === 0) {
      const reshuffled = buildDangerDeck(seed + Math.floor(Math.random() * 1000));
      setDangerDeck(reshuffled);
    }
    const workingDeck = dangerDeck.length ? dangerDeck : buildDangerDeck(seed + 1);
    const [top, ...rest] = workingDeck;
    setDangerDeck(rest);
    return top;
  }

  function drawEscapeCard() {
    if (podDeck.length === 0) return { kind: "red" };
    const [top, ...rest] = podDeck;
    setPodDeck(rest);
    return top;
  }

  function endTurn() {
    setActiveIdx((index) => {
      const nextIndex = players.length ? (index + 1) % players.length : 0;
      if (players.length && nextIndex === 0) {
        setTurn((current) => current + 1);
      }
      return nextIndex;
    });
  }

  function moveActive(toCoord, opts = { attackNow: false, announceNoiseOverride: null }) {
    setPlayers((currentPlayers) => {
      const activePlayer = { ...currentPlayers[activeIdx] };
      if (!activePlayer || !activePlayer.alive || activePlayer.escaped) return currentPlayers;

      const reachable = legalStepsFrom(activePlayer, activePlayer.position, undefined);
      if (!reachable.includes(toCoord)) return currentPlayers;

      activePlayer.position = toCoord;

      if (opts.attackNow && activePlayer.role === "alien") {
        const updatedPlayers = currentPlayers.map((p) => ({ ...p }));
        const victims = updatedPlayers
          .map((p, idx) => ({ player: p, idx }))
          .filter(({ player }) => player.alive && !player.escaped && player.id !== activePlayer.id && player.position === activePlayer.position)
          .map(({ idx }) => idx);

        if (victims.length > 0) {
          let killedHuman = false;
          for (const victimIndex of victims) {
            const victim = updatedPlayers[victimIndex];
            if (victim.role === "alien") {
              victim.alive = false;
              appendLog(`\u{1F480} Attack at ${activePlayer.position}: An Alien (${victim.name}) was slain!`);
            } else {
              victim.alive = false;
              killedHuman = true;
              appendLog(`\u{1F480} Attack at ${activePlayer.position}: Human ${victim.name} eliminated.`);
            }
          }
          if (killedHuman && !activePlayer.feedBonus) {
            activePlayer.feedBonus = true;
            appendLog(`\u{1F50C} ${activePlayer.name} grows stronger (can move up to 3).`);
          }
          updatedPlayers[activeIdx] = activePlayer;
          setTimeout(() => endTurn(), 0);
          return updatedPlayers;
        }

        appendLog(`\u{1F915} Attack at ${activePlayer.position}: No one was there.`);
        const updated = currentPlayers.slice();
        updated[activeIdx] = activePlayer;
        setTimeout(() => endTurn(), 0);
        return updated;
      }

      const cell = map.cells[activePlayer.position];
      if (activePlayer.role === "human" && cell?.type === "pod") {
        const escapeCard = drawEscapeCard();
        if (escapeCard.kind === "green") {
          activePlayer.escaped = true;
          appendLog(`\u{1F680} ${activePlayer.name} reached a Pod at ${activePlayer.position} — GREEN! Escaped!`);
        } else {
          appendLog(`\u{1F6AB} ${activePlayer.name} reached a Pod at ${activePlayer.position} — RED! Pod disabled.`);
          map.cells[activePlayer.position] = { ...map.cells[activePlayer.position], type: "void" };
        }
      } else {
        const draw = drawDanger();
        if (draw.kind === "silence") {
          appendLog(`\u{1F507} SILENCE IN ALL SECTORS.`);
        } else if (draw.kind === "noise-you") {
          appendLog(`\u{1F50A} NOISE IN SECTOR ${activePlayer.position}.`);
        } else if (draw.kind === "noise-any") {
          const fake = opts.announceNoiseOverride || activePlayer.position;
          appendLog(`\u{1F50A} NOISE IN SECTOR ${fake}.`);
        }
      }

      const updated = currentPlayers.slice();
      updated[activeIdx] = activePlayer;
      setTimeout(() => endTurn(), 0);
      return updated;
    });
  }

  const humansAliveList = humansAlive(players);
  const humansEscapedList = computeHumansEscaped(players);
  const alienWin = isAlienWin(players);
  const gameOver = isGameOver(players, turn);

  return {
    seed,
    setSeed,
    map,
    dangerDeck,
    podDeck,
    players,
    setPlayers,
    activeIdx,
    setActiveIdx,
    turn,
    log,
    resetAll,
    addPlayers,
    moveActive,
    legalStepsFrom,
    gameOver,
    alienWin,
    humansEscaped: humansEscapedList,
  };
}
