import Badge from "@components/ui/Badge.jsx";

export default function ControlPanel({ engine }) {
  const { players, activeIdx, gameOver, alienWin, humansEscaped, setActiveIdx, moveActive } = engine;
  const player = players[activeIdx];
  if (!player) return null;

  return (
    <div className="space-y-2">
      <div className="text-sm">
        Active Player View: <strong>{player.name}</strong> <Badge>{player.role.toUpperCase()}</Badge> <Badge>{player.alive ? "ALIVE" : "DEAD"}</Badge> {player.escaped && <Badge>ESCAPED</Badge>}
      </div>
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
            <div className="text-xs text-zinc-400">Humans attack is disabled in Basic build (add Items later).</div>
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
