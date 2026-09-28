# Lucky Dice Web

Mobile-first web remake of the original Python console game **Lucky Dice**.

## Current phase

Phase 6 foundation:

- Vite + TypeScript
- Mobile portrait-first layout
- Dice engine + stage movement state machine
- Centralized economy engine
- Original-compatible per-run event schedule generator
- Typed Event Registry for normal, special, hell, hidden, rare and system events
- Event state flow: stage → registry → choice → result → economy settlement → next turn
- Normal event handlers 1 through 15 are implemented, including number guessing, worship, memory and delayed timed input
- Reusable choice, numeric input, text input, minigame and timed-challenge UI flows are connected
- Angel Feather acquisition and its 50% +1 normal-die effect are connected
- Coin gain/loss bonuses, exact costs, compound growth, rounding and bonus-floor settlement
- Coin <= 0 game-over handling
- Original Python implementation preserved under `legacy/`

All normal-event handlers are ported. Events 7, 9 and 10 remain unreachable under the original stage schedule because the legacy generator never places those IDs; their handlers are ready for a later schedule/content decision. Event 15 is live in the 200–299 stage pool. Special, hell, hidden and blessing events remain for later phases.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Build output:

```text
dist/
```

## Deployment

Deployment target: **Vercel**

Recommended Vercel project settings:

- Framework Preset: Vite
- Production Branch: `main`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

GitHub is used as the source repository. Once this repository is connected to a Vercel project, pushes to `main` can deploy production automatically through Vercel Git integration.
