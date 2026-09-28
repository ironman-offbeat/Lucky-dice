# Lucky Dice artwork slots

Phase 10 keeps artwork optional: the game must remain fully playable if these files are absent.

Expected production filenames:

- title.webp — title / resume artwork
- black-market.webp — black market event
- blessing.webp — blessing event
- hell-gate.webp — hell-stage event family
- dragon.webp — red dragon event
- ending.webp — journey completion

Recommended export:
- WebP
- portrait or square composition with safe center crop
- no embedded UI text
- dark edges for overlay readability
- keep each file reasonably small for mobile delivery

The runtime artwork contract lives in `src/ui/Artwork.ts`.
