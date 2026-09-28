import type { EventId, GameState } from '../game/GameState'
import { resolveHellEvent } from './hell'
import { resolveInputNormalEvent } from './inputNormal'
import { resolveNormalEvent } from './normal'
import { resolveSpecialEvent } from './special'
import type { EventRandomSource } from './schedule'
import type { EventAction, EventResolution } from './types'

export const resolveRegisteredEvent = (
  state: GameState,
  eventId: EventId,
  action: EventAction,
  random: EventRandomSource = Math.random,
): EventResolution | null =>
  resolveHellEvent(state, eventId, action) ??
  resolveSpecialEvent(state, eventId, action, random) ??
  resolveInputNormalEvent(state, eventId, action, random) ??
  resolveNormalEvent(state, eventId, action, random)
