# Lucky Dice Web

Mobile-first web remake of the original Python console game **Lucky Dice**.

## Current phase

Phase 2 scaffold:

- Vite + TypeScript
- Mobile portrait-first layout
- Coin survival gauge
- Dummy rune dice placeholder
- Typed `GameState`
- Original Python implementation preserved under `legacy/`

Gameplay logic is intentionally not connected yet. Dice engine and state transitions begin in Phase 3.

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
