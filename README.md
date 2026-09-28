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
- Normal events 1, 2, 3, 4, 5, 6, 8, 11, 12, 13 and 14 now execute their original effects
- Choice-event buttons and reusable numeric input support are connected for taxi, angel, dragon, wind spirit and gambling
- Angel Feather acquisition and its 50% +1 normal-die effect are connected
- Coin gain/loss bonuses, exact costs, compound growth, rounding and bonus-floor settlement
- Coin <= 0 game-over handling
- Original Python implementation preserved under `legacy/`

Eleven normal events are live. Input-heavy events 7, 9, 10 and 15 plus remaining special, hell, hidden and blessing events are still routed through the framework placeholder until their dedicated port phases.

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
