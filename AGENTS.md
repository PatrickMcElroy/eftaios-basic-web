# Repository Guidelines

## Project Structure & Module Organization
- `src/App.jsx` currently holds the entire game engine and UI; start refactors by extracting pure utilities into `src/` submodules and keep render logic co-located with components.
- `src/main.jsx` wires React to `index.html`; `src/index.css` only bootstraps Tailwind layers plus global height tweaks.
- Configuration lives at the repo root (`vite.config.js`, `tailwind.config.js`, `postcss.config.js`) so updates apply across future modules.

## Build, Test, and Development Commands
- `npm install` installs React, Vite, and Tailwind; run once when cloning or when package versions change.
- `npm run dev` starts the Vite dev server with hot reload at `http://localhost:5173`.
- `npm run build` produces the optimized static bundle in `dist/` for deployment or manual smoke testing.
- `npm run preview` serves the built assets locally; use it to reproduce production behavior.

## Coding Style & Naming Conventions
- Prefer React function components with hooks; keep shared state helpers pure so they can move into dedicated files later.
- Use two-space indentation, double quotes, and trailing semicolons to match existing files.
- Components stay `PascalCase`; helper functions, hooks, and state setters are `camelCase`. Tailwind utility classes should be grouped by layout → color → interaction for readability.

## Testing Guidelines
- No automated harness is checked in yet; perform manual passes covering lobby setup, human/alien movement limits, attacks, pod draws, and victory conditions after every significant change.
- When bugs are reproduced, capture steps and expected outcomes in the pull request. If you add tests, align on Vitest + React Testing Library so they plug into Vite without extra configuration.

## Commit & Pull Request Guidelines
- There is no git history here, so adopt imperative, scoped subjects (e.g. `feat: add pod status panel`, `fix: clamp alien sprint range`). Keep commits focused and reorder if necessary before pushing.
- Pull requests should outline motivation, summarize user-visible changes, list manual test evidence, and include screenshots or short clips when UI shifts.
- Link issues where applicable and flag follow-up tasks in a bullet list so the backlog stays discoverable.
