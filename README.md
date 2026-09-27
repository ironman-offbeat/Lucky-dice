# Lucky Dice Web

Mobile-first web remake of the original Python console game **Lucky Dice**.

## Phase 2 scope

- Vite + TypeScript project shell
- Mobile portrait-first layout
- Coin survival gauge
- Placeholder dummy-dice visual
- Typed `GameState`
- Original Python implementation preserved under `legacy/`
- GitHub Pages workflow

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

## GitHub Pages

The included workflow builds `dist/` and deploys it with GitHub Pages Actions on pushes to `main`.
Repository Settings > Pages must use **GitHub Actions** as the source.
