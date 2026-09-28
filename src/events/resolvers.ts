import type { EventId, GameState } from '../game/GameState'
import { resolveNormalEvent } from './normal'
import type { EventRandomSource } from './schedule'
import type { EventAction, EventResolution } from './types'

export const resolveRegisteredEvent = (
  state: GameState,
  eventId: EventId,
  action: EventAction,
  random: EventRandomSource = Math.random,
): EventResolution | null =>
  resolveNormalEvent(state, eventId, action, random)
