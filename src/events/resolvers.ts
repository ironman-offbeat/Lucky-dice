import type { EventId, GameState } from '../game/GameState'
import { resolveInputNormalEvent } from './inputNormal'
import { resolveNormalEvent } from './normal'
import type { EventRandomSource } from './schedule'
import type { EventAction, EventResolution } from './types'

export const resolveRegisteredEvent = (
  state: GameState,
  eventId: EventId,
  action: EventAction,
  random: EventRandomSource = Math.random,
): EventResolution | null =>
  resolveInputNormalEvent(state, eventId, action, random) ??
  resolveNormalEvent(state, eventId, action, random)
