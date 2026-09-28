# Lucky Dice Web

Mobile-first web remake of the original Python console game **Lucky Dice**.

## Current phase

Phase 8B complete:

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
- Blessing catalog SSOT and blessing engine are connected for all nine legacy blessings
- 100-stage blessing events offer three source-compatible candidates plus rejection; accepted blessings are removed from the run pool
- Compound, Greed, Regression, J, Dice, Fog, Stars, Fame and Swift blessing effects are live
- Fame blessing routes the next three events through Famous Path choices
- Stars blessing injects Stage-49 star events into the existing schedule, with source-compatible single-offer behavior
- Dice blessing exposes a one-use 1–50 movement control that bypasses normal modifier and Piggy Bank effects
- Hidden Stage <= 0 event is live: returns to Stage 0 and grants dice modifier +2
- Stage 1 hidden event (-1) is live with expectation, worry and memory choices
- Stage 1 memory preserves the legacy 25% star-memory branch and can grant Stars Blessing only while it remains available
- System event 0 is an explicit no-effect rest event instead of a framework placeholder
- Memory Saver now records a save request flag for the later LocalStorage save phase
- Original Python implementation preserved under `legacy/`

All normal-event handlers are ported. Event 7 remains intentionally excluded from the stage schedule. Events 9 (worship) and 10 (memory) are restored only in ordinary Stage 200–299 slots with weight 4 each versus weight 12 for the existing seven events, giving each about 4.35% of those ordinary slots. Event 15 remains in the same pool at the standard weight. Phase 8 event-layer port is complete: blessings, blessing-derived star/fame paths, hidden Stage <= 0 and Stage 1 events, and system rest slot 0 are live. Legacy making/thend/hgate hidden-ending remnants are intentionally not activated because the source main loop never reaches them as a completed gameplay path. The next major phase is save/load and persistence.

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
