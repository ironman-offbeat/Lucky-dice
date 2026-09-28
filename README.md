# Lucky Dice Web

Mobile-first web remake of the original Python console game **Lucky Dice**.

## Current phase

Phase 6 foundation:

- Vite + TypeScript
- Mobile portrait-first layout
- Dice engine + stage movement state machine
- Centralized economy engine
- Original-compatible per-run event schedule generator
- Explicit weighted event support for low-frequency content
- Typed Event Registry for normal, special, hell, hidden, rare and system events
- Event state flow: stage → registry → choice → result → economy settlement → next turn
- Normal event handlers 1 through 15 are implemented, including number guessing, worship, memory and delayed timed input
- Reusable choice, numeric input, text input, minigame and timed-challenge UI flows are connected
- Angel Feather acquisition and its 50% +1 normal-die effect are connected
- Coin gain/loss bonuses, exact costs, compound growth, rounding and bonus-floor settlement
- Coin <= 0 game-over handling
- Original Python implementation preserved under `legacy/`

All normal-event handlers are ported. Event 7 remains intentionally excluded from the stage schedule. Events 9 (worship) and 10 (memory) are restored only in ordinary Stage 200–299 slots with weight 4 each versus weight 12 for the existing seven events, giving each about 4.35% of those ordinary slots. Event 15 remains in the same pool at the standard weight. Special, hell, hidden and blessing events remain for later phases.

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
