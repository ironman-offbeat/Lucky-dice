import type { EventId, GameState } from '../game/GameState'
import { resolveNormalEvent } from './normal'
import type { EventRandomSource } from './schedule'
import type { EventResolution } from './types'

export const resolveRegisteredEvent = (
  state: GameState,
  eventId: EventId,
  random: EventRandomSource = Math.random,
): EventResolution | null =>
  resolveNormalEvent(state, eventId, random)
