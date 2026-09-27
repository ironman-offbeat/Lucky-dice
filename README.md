# Lucky Dice Web

Mobile-first web remake of the original Python console game **Lucky Dice**.

## Current phase

Phase 4 foundation:

- Vite + TypeScript
- Mobile portrait-first layout
- Dice engine + stage movement state machine
- Centralized economy engine
- Coin gain/loss bonuses, exact costs, compound growth, rounding and bonus-floor settlement
- Coin <= 0 game-over handling
- Original Python implementation preserved under `legacy/`

Actual event content is connected in the next Event Engine phase.

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
