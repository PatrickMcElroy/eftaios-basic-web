# Escape from the Aliens in Outer Space — Basic Web Edition

This is a self-contained Vite + React + Tailwind project for running the **Basic rules** web build.
It matches the version currently in your Canvas and is ready for you to expand with Items, Abilities, 
and the exact Galilei map JSON later.

## Quick start

```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

## What’s included
- React 18 + Vite
- TailwindCSS
- Single-file game engine/UI in `src/App.jsx` for easy hacking
- No network fetches, purely client-side

## Notes
- The board is a symmetric hex-adjacent ship mask (A..W by 01..14) for fast iteration.
- Dangerous Sector: Silence / Noise in Your Sector / Noise in Any Sector. 
- Escape Pods: draw when entering; Green = escape, Red = disabled.
- Aliens can attack instead of drawing.
- Movement: Humans 1, Aliens 1–2 (1–3 after first Human kill).
# eftaios-basic-web
