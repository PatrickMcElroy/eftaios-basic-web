import { useGameEngine } from "@game/engine/useGameEngine.js";
import Board from "@components/Board.jsx";
import ControlPanel from "@components/ControlPanel.jsx";
import Lobby from "@components/Lobby.jsx";
import Sidebar from "@components/Sidebar.jsx";
import "./index.css";

export default function App() {
  const engine = useGameEngine();
  const { players } = engine;

  return (
    <div className="min-h-screen text-zinc-200 p-4 bg-gradient-to-b from-black via-zinc-950 to-black">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Escape from the Aliens in Outer Space — Basic Web Edition</h1>
          {players.length === 0 ? (
            <Lobby engine={engine} />
          ) : (
            <>
              <Board engine={engine} />
              <ControlPanel engine={engine} />
            </>
          )}
        </div>
        <div className="space-y-4">
          <Sidebar engine={engine} />
          <div className="rounded border border-zinc-700 p-3 text-xs bg-black/30">
            <div className="font-semibold mb-1">Quick Tips</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Humans move 1. Aliens move 1–2 (1–3 after first Human kill).</li>
              <li>End your move on a Pod and draw a Pod card: Green = escape, Red = pod disabled.</li>
              <li>Aliens may attack in their sector instead of drawing a Dangerous card.</li>
              <li>Dangerous draw outcomes: Silence, Noise in Your Sector, Noise in Any Sector (fake allowed).</li>
              <li>After start, you cannot end your move in Human / Alien hub sectors.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
