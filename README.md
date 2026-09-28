# Lucky Dice Web

Mobile-first web remake of the original Python console game **Lucky Dice**.

## Current phase

Phase 7 complete:

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
- Hell events 20–23 are live; event 24 is implemented but remains absent from the legacy-compatible schedule
- Special events 50, 51, 53 and 55 are live; hell rest slot 66 is explicit
- Cathedral and tax choices are derived from current state instead of hardcoded UI branches
- Item catalog SSOT added for all 14 legacy black-market items, including normalized Piggy Bank price 10
- Special event 52 shop is live with one-time entry coin grant, dice upgrade, gain-bonus upgrade and J lottery
- J lottery uses a serializable minigame state and mobile 1–45 number picker
- Special event 54 black market is live with up to four fixed offers, repeated purchasing, and item removal after purchase
- Item effects are centralized in ItemEngine instead of black-market-specific branches
- Black-market 777 roulette is centralized in RouletteEngine and reused by rare event 77
- Rare event 77 is live with exactly three free spin opportunities and optional early exit
- Memory Saver now records a save request flag for the later LocalStorage save phase
- Original Python implementation preserved under `legacy/`

All normal-event handlers are ported. Event 7 remains intentionally excluded from the stage schedule. Events 9 (worship) and 10 (memory) are restored only in ordinary Stage 200–299 slots with weight 4 each versus weight 12 for the existing seven events, giving each about 4.35% of those ordinary slots. Event 15 remains in the same pool at the standard weight. Phase 7 event port is complete: hell, core special, shop, black market, item effects and rare roulette 77 are live. Rare event 77 retains the original one-per-run placement and three free spin opportunities. Hidden/system events and the blessing system remain for the next phase.

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
