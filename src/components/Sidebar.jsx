import Badge from "@components/ui/Badge.jsx";

export default function Sidebar({ engine }) {
  const { log, turn, players, map } = engine;
  const alive = players.filter((player) => player.alive && !player.escaped).length;
  const podsRemaining = Object.values(map.cells).filter((cell) => cell.type === "pod").length;

  return (
    <div className="space-y-2">
      <div className="text-sm">
        Turn: <Badge>{turn + 1}</Badge> Live aboard: <Badge>{alive}</Badge> Pods remaining: <Badge>{podsRemaining}</Badge>
      </div>
      <div className="text-sm font-semibold">Announcements</div>
      <div className="h-64 overflow-auto rounded border border-zinc-700 bg-black/30 p-2 text-xs leading-5">
        {log.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>
      <div className="text-xs text-zinc-500">Basic rules only. Add Items/Abilities, respawn-on-death-as-Alien, and proper deck composition next.</div>
    </div>
  );
}
