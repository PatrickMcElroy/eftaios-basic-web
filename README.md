# Escape from the Aliens in Outer Space — Basic Web Edition

This repository now ships a lightweight static build (plain HTML, CSS, and JavaScript) of the
**Basic rules** web board. It is tuned for quickly iterating on the visual layout of the ship map
without any external toolchain or npm dependencies.

## Quick start

Open `index.html` directly in a browser, or serve the folder with any static HTTP server (for
example, `python3 -m http.server`).

## What’s included
- No build step — the ship map is rendered via modern browser APIs (ES modules + SVG).
- Responsive, hex-based ship map that matches the adjacency of the physical board.
- All assets are contained in `index.html`, `styles/global.css`, and the small scripts in `src/`.

## Notes
- The board is procedurally generated as a symmetric hex mask (letters A..U by rows 01..21).
- Dangerous Sector: Silence / Noise in Your Sector / Noise in Any Sector. 
- Escape Pods: draw when entering; Green = escape, Red = disabled.
- Aliens can attack instead of drawing.
- Movement: Humans 1, Aliens 1–2 (1–3 after first Human kill).
# eftaios-basic-web
