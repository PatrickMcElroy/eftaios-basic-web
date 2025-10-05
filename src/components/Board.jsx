import { useState } from "react";
import Cell from "@components/Cell.jsx";
import Badge from "@components/ui/Badge.jsx";
import { coordOf, letters, numbers } from "@game/logic/constants.js";

export default function Board({ engine }) {
  const { map, players, activeIdx, legalStepsFrom, moveActive } = engine;
  const activePlayer = players[activeIdx];
  const [hover, setHover] = useState(null);
  const legal = activePlayer ? new Set(legalStepsFrom(activePlayer, activePlayer.position)) : new Set();

  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-zinc-300">
        Ship Map (basic). Hubs: <Badge>Human: {map.humanHub}</Badge> <Badge>Alien: {map.alienHub}</Badge>
      </div>
      <div className="overflow-auto">
        <div className="inline-grid" style={{ gridTemplateColumns: `repeat(${letters.length}, minmax(0, 1fr))`, gap: 4 }}>
          {letters.map((letter) => (
            numbers.map((number) => {
              const id = coordOf(letter, number);
              const cell = map.cells[id];
              const isLegal = legal.has(id);
              return (
                <div
                  key={id}
                  onMouseEnter={() => setHover(id)}
                  onMouseLeave={() => setHover(null)}
                >
                  <Cell
                    id={id}
                    cell={cell}
                    selected={isLegal}
                    onClick={(cellId) => {
                      if (!activePlayer) return;
                      if (isLegal) moveActive(cellId);
                    }}
                  />
                </div>
              );
            })
          ))}
        </div>
      </div>
      <div className="text-xs text-zinc-400">Hover: {hover || "—"}</div>
    </div>
  );
}
