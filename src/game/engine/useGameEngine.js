import { useMemo, useState } from "react";
import { buildDangerDeck, buildEscapePodDeck } from "@game/logic/decks.js";
import { dealCharacters } from "@game/logic/characters.js";
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

  function createAbilityState(character) {
    switch (character.id) {
      case "captain":
        return { skipUsed: false };
      case "pilot":
        return { ready: true, pendingNoises: null };
      case "psychologist":
        return {};
      case "soldier":
        return { attackAvailable: true, attackPrimed: false };
      case "executive":
        return { holdAvailable: true };
      case "copilot":
        return { teleportAvailable: true };
      case "engineer":
        return {};
      case "medic":
        return { revealAvailable: true };
      case "blink":
      case "silent":
      case "surge":
        return {};
      case "brute":
        return { revealed: false };
      case "invisible":
        return { revealed: false };
      case "lurking":
        return {};
      case "fast":
        return { firstMoveComplete: false };
      case "psychic":
        return {};
      default:
        return {};
    }
  }

  function addPlayers(names) {
    const characters = dealCharacters(names.length, seed);
    const nextPlayers = names.map((name, index) => {
      const character = characters[index];
      const role = character.role;
      const basePosition = role === "human" ? map.humanHub : map.alienHub;
      return {
        id: `P${index + 1}`,
        name: name.trim() || `Player ${index + 1}`,
        role,
        character,
        alive: true,
        feedBonus: false,
        position:
          character.id === "psychologist" && role === "human" ? map.alienHub : basePosition,
        escaped: false,
        items: [],
        revealed: false,
        abilityState: createAbilityState(character),
      };
    });
    setPlayers(nextPlayers);
    appendLog(
      `\u{1F680} New game: ${nextPlayers.length} players. Characters and roles dealt secretly.`,
    );
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

  function moveActive(
    toCoord,
    opts = { attackNow: false, announceNoiseOverride: null, forceStay: false, source: null },
  ) {
    setPlayers((currentPlayers) => {
      const basePlayer = currentPlayers[activeIdx];
      const activePlayer = {
        ...basePlayer,
        abilityState: { ...basePlayer?.abilityState },
        items: basePlayer?.items ? basePlayer.items.slice() : [],
      };
      if (!activePlayer || !activePlayer.alive || activePlayer.escaped) return currentPlayers;

      if (!opts.forceStay) {
        const reachable = legalStepsFrom(activePlayer, activePlayer.position, undefined);
        if (!reachable.includes(toCoord)) return currentPlayers;
      } else if (toCoord !== activePlayer.position) {
        return currentPlayers;
      }

      activePlayer.position = toCoord;

      if (opts.source === "executive-hold" && activePlayer.character?.id === "executive") {
        if (activePlayer.abilityState?.holdAvailable) {
          activePlayer.abilityState.holdAvailable = false;
          appendLog(`\u{1F511} Executive Officer ${activePlayer.name} holds position this turn.`);
        } else {
          return currentPlayers;
        }
      }

      if (activePlayer.character?.id === "fast" && !activePlayer.abilityState?.firstMoveComplete) {
        activePlayer.abilityState.firstMoveComplete = true;
      }

      const isSoldierAttack =
        activePlayer.role === "human" &&
        activePlayer.character?.id === "soldier" &&
        activePlayer.abilityState?.attackAvailable &&
        opts.attackNow;

      if (opts.attackNow && (activePlayer.role === "alien" || isSoldierAttack)) {
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
              if (victim.character?.id === "brute") {
                victim.revealed = true;
                appendLog(`\u{1F9DF}\u200D\u2642\uFE0F Brute Alien ${victim.name} shrugs off the attack!`);
              } else {
                victim.alive = false;
                appendLog(`\u{1F480} Attack at ${activePlayer.position}: An Alien (${victim.name}) was slain!`);
              }
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
          if (isSoldierAttack) {
            activePlayer.abilityState.attackAvailable = false;
          }
          updatedPlayers[activeIdx] = activePlayer;
          setTimeout(() => endTurn(), 0);
          return updatedPlayers;
        }

        appendLog(`\u{1F915} Attack at ${activePlayer.position}: No one was there.`);
        const updated = currentPlayers.slice();
        if (isSoldierAttack) {
          activePlayer.abilityState.attackAvailable = false;
        }
        updated[activeIdx] = activePlayer;
        setTimeout(() => endTurn(), 0);
        return updated;
      }

      const cell = map.cells[activePlayer.position];
      if (activePlayer.role === "human" && cell?.type === "pod") {
        let escapeCard;
        if (activePlayer.character?.id === "engineer") {
          let drawnCards = [];
          setPodDeck((currentDeck) => {
            if (currentDeck.length === 0) {
              drawnCards = [];
              return currentDeck;
            }
            drawnCards = currentDeck.slice(0, Math.min(2, currentDeck.length));
            let chosenIndex = 0;
            if (drawnCards.length === 2) {
              const firstGreen = drawnCards[0].kind === "green";
              const secondGreen = drawnCards[1].kind === "green";
              if (!firstGreen && secondGreen) {
                chosenIndex = 1;
              }
            }
            escapeCard = drawnCards[chosenIndex];
            let remainder = currentDeck.slice(drawnCards.length);
            const leftovers = drawnCards.filter((_, idx) => idx !== chosenIndex);
            if (leftovers.length > 0) {
              const insertIndex = remainder.length ? Math.floor(Math.random() * (remainder.length + 1)) : 0;
              const next = remainder.slice();
              next.splice(insertIndex, 0, leftovers[0]);
              remainder = next;
            }
            return remainder;
          });
          if (!escapeCard && drawnCards.length === 1) {
            escapeCard = drawnCards[0];
          }
          if (drawnCards.length > 1) {
            appendLog(
              `\u{1F527} Engineer ${activePlayer.name} scans pods (${drawnCards
                .map((card) => card.kind.toUpperCase())
                .join(", ")}) and picks ${escapeCard?.kind.toUpperCase()}.`,
            );
          } else if (drawnCards.length === 1) {
            appendLog(`\u{1F527} Engineer ${activePlayer.name} draws the last pod card (${escapeCard?.kind.toUpperCase()}).`);
          } else {
            appendLog(`\u{1F527} Engineer ${activePlayer.name} finds no pod cards remaining.`);
            escapeCard = { kind: "red" };
          }
        } else {
          escapeCard = drawEscapeCard();
        }

        const outcome = escapeCard ?? { kind: "red" };
        if (outcome.kind === "green") {
          activePlayer.escaped = true;
          appendLog(`\u{1F680} ${activePlayer.name} reached a Pod at ${activePlayer.position} — GREEN! Escaped!`);
        } else {
          appendLog(`\u{1F6AB} ${activePlayer.name} reached a Pod at ${activePlayer.position} — RED! Pod disabled.`);
          map.cells[activePlayer.position] = { ...map.cells[activePlayer.position], type: "void" };
        }
      } else {
        let skipDraw = false;
        if (
          activePlayer.character?.id === "captain" &&
          !activePlayer.abilityState?.skipUsed &&
          cell?.type === "danger"
        ) {
          skipDraw = true;
          activePlayer.abilityState.skipUsed = true;
          appendLog(`\u{1F6E1}\uFE0F Captain ${activePlayer.name} avoids the first Danger draw.`);
        }

        if (!skipDraw) {
          const draw = drawDanger();
          if (draw.kind === "silence") {
            if (activePlayer.character?.id === "pilot" && activePlayer.abilityState?.pendingNoises) {
              const [first, second] = activePlayer.abilityState.pendingNoises;
              appendLog(`\u{1F50A} NOISE IN SECTOR ${first}. (Pilot decoy)`);
              appendLog(`\u{1F50A} NOISE IN SECTOR ${second}. (Pilot decoy)`);
              activePlayer.abilityState.pendingNoises = null;
              activePlayer.abilityState.ready = false;
            } else if (activePlayer.character?.id === "psychic") {
              const fakeCoords = opts.announceNoiseOverride || activePlayer.position;
              appendLog(`\u{1F52E} NOISE IN SECTOR ${fakeCoords}. (Psychic echo)`);
            } else {
              appendLog(`\u{1F507} SILENCE IN ALL SECTORS.`);
            }
          } else if (draw.kind === "noise-you") {
            if (activePlayer.character?.id === "pilot" && activePlayer.abilityState?.pendingNoises) {
              const [first, second] = activePlayer.abilityState.pendingNoises;
              const actual = activePlayer.position;
              const firstUpper = first.toUpperCase();
              const secondUpper = second.toUpperCase();
              const actualUpper = actual.toUpperCase();
              const decoy = firstUpper === actualUpper ? secondUpper : firstUpper;
              appendLog(`\u{1F50A} NOISE IN SECTOR ${actualUpper}.`);
              appendLog(`\u{1F50A} NOISE IN SECTOR ${decoy}. (Pilot decoy)`);
              activePlayer.abilityState.pendingNoises = null;
              activePlayer.abilityState.ready = false;
            } else {
              appendLog(`\u{1F50A} NOISE IN SECTOR ${activePlayer.position}.`);
            }
          } else if (draw.kind === "noise-any") {
            if (activePlayer.character?.id === "pilot" && activePlayer.abilityState?.pendingNoises) {
              const [first, second] = activePlayer.abilityState.pendingNoises;
              appendLog(`\u{1F50A} NOISE IN SECTOR ${first}. (Pilot decoy)`);
              appendLog(`\u{1F50A} NOISE IN SECTOR ${second}. (Pilot decoy)`);
              activePlayer.abilityState.pendingNoises = null;
              activePlayer.abilityState.ready = false;
            } else {
              const fake = opts.announceNoiseOverride || activePlayer.position;
              appendLog(`\u{1F50A} NOISE IN SECTOR ${fake}.`);
            }
          }
        }
      }

      const updated = currentPlayers.slice();
      updated[activeIdx] = activePlayer;
      setTimeout(() => endTurn(), 0);
      return updated;
    });
  }

  function preparePilotDecoy(firstCoord, secondCoord) {
    setPlayers((currentPlayers) => {
      const player = currentPlayers[activeIdx];
      if (!player || player.character?.id !== "pilot") return currentPlayers;
      if (!player.alive || player.escaped) return currentPlayers;
      const abilityState = player.abilityState || {};
      if (!abilityState.ready) return currentPlayers;
      const first = firstCoord?.trim().toUpperCase();
      const second = secondCoord?.trim().toUpperCase();
      if (!first || !second || first === second) return currentPlayers;
      if (!map.cells[first] || !map.cells[second]) return currentPlayers;
      const updated = currentPlayers.slice();
      updated[activeIdx] = {
        ...player,
        abilityState: { ...abilityState, pendingNoises: [first, second] },
      };
      appendLog(`\u{1F6F0}\uFE0F Pilot ${player.name} primes a double-noise bluff (${first} & ${second}).`);
      return updated;
    });
  }

  function useSoldierAttack() {
    const player = players[activeIdx];
    if (!player || player.character?.id !== "soldier") return;
    if (!player.abilityState?.attackAvailable || !player.alive || player.escaped) return;
    appendLog(`\u{1F44A} Soldier ${player.name} launches a surprise attack!`);
    moveActive(player.position, { attackNow: true, forceStay: true, source: "soldier-attack" });
  }

  function useExecutiveHold() {
    const player = players[activeIdx];
    if (!player || player.character?.id !== "executive") return;
    if (!player.abilityState?.holdAvailable || !player.alive || player.escaped) return;
    moveActive(player.position, { forceStay: true, source: "executive-hold" });
  }

  function useCoPilotTeleport() {
    setPlayers((currentPlayers) => {
      const player = currentPlayers[activeIdx];
      if (!player || player.character?.id !== "copilot") return currentPlayers;
      if (!player.alive || player.escaped) return currentPlayers;
      if (!player.abilityState?.teleportAvailable) return currentPlayers;
      const updated = currentPlayers.slice();
      updated[activeIdx] = {
        ...player,
        position: map.humanHub,
        abilityState: { ...player.abilityState, teleportAvailable: false },
      };
      appendLog(`\u{1F680} Co-Pilot ${player.name} teleports to Human hub ${map.humanHub}.`);
      return updated;
    });
  }

  function useMedicReveal(targetId) {
    if (!targetId) return;
    setPlayers((currentPlayers) => {
      const medic = currentPlayers[activeIdx];
      if (!medic || medic.character?.id !== "medic") return currentPlayers;
      if (!medic.alive || medic.escaped) return currentPlayers;
      if (!medic.abilityState?.revealAvailable) return currentPlayers;
      const targetIndex = currentPlayers.findIndex((p) => p.id === targetId);
      if (targetIndex === -1) return currentPlayers;
      const updated = currentPlayers.slice();
      const target = { ...updated[targetIndex], revealed: true };
      updated[targetIndex] = target;
      updated[activeIdx] = {
        ...medic,
        abilityState: { ...medic.abilityState, revealAvailable: false },
      };
      appendLog(
        `\u{1F691} Medic ${medic.name} scans ${target.name} — revealed as ${target.role.toUpperCase()} (${target.character?.name}).`,
      );
      return updated;
    });
  }

  function useLurkingAttack() {
    const player = players[activeIdx];
    if (!player || player.character?.id !== "lurking") return;
    if (!player.alive || player.escaped) return;
    appendLog(`\u{1F47D} ${player.name} lunges from the shadows!`);
    moveActive(player.position, { attackNow: true, forceStay: true, source: "lurking-attack" });
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
    preparePilotDecoy,
    useSoldierAttack,
    useExecutiveHold,
    useCoPilotTeleport,
    useMedicReveal,
    useLurkingAttack,
    gameOver,
    alienWin,
    humansEscaped: humansEscapedList,
  };
}
