import { useState } from "react";
import { DEFAULT_SEED } from "@game/logic/constants.js";

export default function Lobby({ engine }) {
  const { addPlayers, resetAll, seed, setSeed } = engine;
  const [names, setNames] = useState(["Ripley", "Parker", "Lambert", "Dallas", "Kane", "Ash"]);

  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">Setup</div>
      <div className="text-sm text-zinc-300">Enter player names (2–8 recommended for this build). Roles are dealt secretly per rules.</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {names.map((name, index) => (
          <input
            key={index}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
            value={name}
            onChange={(event) => {
              const next = names.slice();
              next[index] = event.target.value;
              setNames(next);
            }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600"
          onClick={() => addPlayers(names.filter(Boolean))}
        >
          Deal Roles & Start
        </button>
        <button
          className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
          onClick={() => setNames((prev) => prev.concat("").slice(0, 12))}
        >
          + Add slot
        </button>
        <button
          className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
          onClick={() => resetAll(seed)}
        >
          Reset
        </button>
        <label className="text-xs flex items-center gap-2">
          Seed
          <input
            className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
            value={seed}
            onChange={(event) => setSeed(parseInt(event.target.value || "0") || DEFAULT_SEED)}
          />
        </label>
      </div>
    </div>
  );
}
