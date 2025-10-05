import { useState } from "react";
import Badge from "@components/ui/Badge.jsx";

export default function ControlPanel({ engine }) {
  const {
    players,
    activeIdx,
    gameOver,
    alienWin,
    humansEscaped,
    setActiveIdx,
    moveActive,
    preparePilotDecoy,
    useSoldierAttack,
    useExecutiveHold,
    useCoPilotTeleport,
    useMedicReveal,
    useLurkingAttack,
  } = engine;
  const player = players[activeIdx];
  const [medicTarget, setMedicTarget] = useState("");
  if (!player) return null;

  const abilityState = player.abilityState || {};

  return (
    <div className="space-y-2">
      <div className="text-sm">
        Active Player View: <strong>{player.name}</strong> <Badge>{player.role.toUpperCase()}</Badge> {player.character && <Badge>{player.character.name}</Badge>} <Badge>{player.alive ? "ALIVE" : "DEAD"}</Badge> {player.escaped && <Badge>ESCAPED</Badge>}
      </div>
      {player.character && (
        <div className="text-xs text-zinc-300 bg-zinc-900/70 border border-zinc-700 rounded p-2">
          <div className="font-semibold">Ability</div>
          <div>{player.character.ability}</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {player.character.id === "pilot" && abilityState.ready && !abilityState.pendingNoises && (
              <button
                className="px-2 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-xs"
                onClick={() => {
                  const first = window.prompt("Pilot decoy: first sector (e.g. D08)");
                  const second = window.prompt("Pilot decoy: second sector");
                  if (first && second) preparePilotDecoy(first, second);
                }}
              >
                Prepare double noise
              </button>
            )}
            {player.character.id === "pilot" && abilityState.pendingNoises && (
              <span className="text-xs text-amber-300">Pending decoy at {abilityState.pendingNoises.join(" & ")}</span>
            )}
            {player.character.id === "pilot" && !abilityState.ready && !abilityState.pendingNoises && (
              <span className="text-xs text-zinc-400 italic">Decoy ability spent.</span>
            )}
            {player.character.id === "soldier" && abilityState.attackAvailable && (
              <button
                className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-xs"
                onClick={() => useSoldierAttack()}
              >
                Use attack
              </button>
            )}
            {player.character.id === "soldier" && !abilityState.attackAvailable && (
              <span className="text-xs text-zinc-400 italic">Attack used.</span>
            )}
            {player.character.id === "executive" && abilityState.holdAvailable && (
              <button
                className="px-2 py-1 rounded bg-sky-700 hover:bg-sky-600 text-xs"
                onClick={() => useExecutiveHold()}
              >
                Hold position this turn
              </button>
            )}
            {player.character.id === "executive" && !abilityState.holdAvailable && (
              <span className="text-xs text-zinc-400 italic">Hold already used.</span>
            )}
            {player.character.id === "copilot" && abilityState.teleportAvailable && (
              <button
                className="px-2 py-1 rounded bg-purple-700 hover:bg-purple-600 text-xs"
                onClick={() => useCoPilotTeleport()}
              >
                Teleport to Human hub
              </button>
            )}
            {player.character.id === "copilot" && !abilityState.teleportAvailable && (
              <span className="text-xs text-zinc-400 italic">Teleport spent.</span>
            )}
            {player.character.id === "medic" && abilityState.revealAvailable && (
              <div className="flex items-center gap-2">
                <select
                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
                  value={medicTarget}
                  onChange={(event) => setMedicTarget(event.target.value)}
                >
                  <option value="">Select target</option>
                  {players
                    .filter((candidate) => candidate.id !== player.id)
                    .map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </option>
                    ))}
                </select>
                <button
                  className="px-2 py-1 rounded bg-rose-700 hover:bg-rose-600 text-xs disabled:opacity-50"
                  disabled={!medicTarget}
                  onClick={() => {
                    if (medicTarget) {
                      useMedicReveal(medicTarget);
                      setMedicTarget("");
                    }
                  }}
                >
                  Reveal identity
                </button>
              </div>
            )}
            {player.character.id === "medic" && !abilityState.revealAvailable && (
              <span className="text-xs text-zinc-400 italic">Reveal used.</span>
            )}
            {player.character.id === "lurking" && player.alive && !player.escaped && (
              <button
                className="px-2 py-1 rounded bg-rose-700 hover:bg-rose-600 text-xs"
                onClick={() => useLurkingAttack()}
              >
                Attack without moving
              </button>
            )}
          </div>
        </div>
      )}
      {!gameOver && player.alive && !player.escaped && (
        <div className="flex gap-2">
          {player.role === "alien" && (
            <button
              className="px-3 py-1 rounded bg-rose-700 hover:bg-rose-600"
              onClick={() => moveActive(player.position, { attackNow: true })}
            >
              Attack here
            </button>
          )}
          {player.role !== "alien" && (
            <div className="text-xs text-zinc-400">
              Humans may only attack via abilities or future Item cards. Soldiers can trigger their strike above.
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-zinc-400">Switch view:</span>
        {players.map((candidate, index) => (
          <button
            key={candidate.id}
            className={`px-2 py-1 rounded ${index === activeIdx ? "bg-cyan-700" : "bg-zinc-800 hover:bg-zinc-700"}`}
            onClick={() => setActiveIdx(index)}
          >
            {candidate.name}
          </button>
        ))}
      </div>
      {gameOver && (
        <div className="mt-2 p-2 rounded bg-zinc-900 border border-zinc-700 text-sm">
          <div className="font-semibold">Game Over</div>
          {alienWin ? (
            <div>Aliens win (last Human eliminated or time expired).</div>
          ) : (
            <div>
              At least one Human escaped. Human individual victories: {humansEscaped.map((human) => human.name).join(", ") || "—"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
