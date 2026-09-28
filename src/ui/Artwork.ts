import type { EventId } from '../game/GameState'

export type ArtworkSlot =
  | 'title'
  | 'black-market'
  | 'blessing'
  | 'hell-gate'
  | 'dragon'
  | 'ending'

export const ARTWORK_FILES: Record<ArtworkSlot, string> = {
  title: '/images/title.webp',
  'black-market': '/images/black-market.webp',
  blessing: '/images/blessing.webp',
  'hell-gate': '/images/hell-gate.webp',
  dragon: '/images/dragon.webp',
  ending: '/images/ending.webp',
}

export const artworkSlotForEvent = (
  eventId: EventId | null,
): ArtworkSlot | null => {
  if (eventId === 54) return 'black-market'
  if (eventId === 'blessing' || eventId === 49) return 'blessing'
  if (
    eventId === 20 ||
    eventId === 21 ||
    eventId === 22 ||
    eventId === 23 ||
    eventId === 24 ||
    eventId === 66
  ) {
    return 'hell-gate'
  }
  if (eventId === 8) return 'dragon'
  return null
}
