import type { EventId, GameState } from '../game/GameState'
import { prepareBlessingEvent, resolveBlessingEvent } from './blessing'
import { resolveHellEvent } from './hell'
import { resolveHiddenEvent } from './hidden'
import { resolveInputNormalEvent } from './inputNormal'
import { resolveNormalEvent } from './normal'
import { resolveRareEvent } from './rare'
import { prepareSpecialEvent, resolveSpecialEvent } from './special'
import { resolveSystemEvent } from './system'
import type { EventRandomSource } from './schedule'
import type { EventAction, EventResolution } from './types'

export const resolveRegisteredEvent = (
  state: GameState,
  eventId: EventId,
  action: EventAction,
  random: EventRandomSource = Math.random,
): EventResolution | null =>
  resolveBlessingEvent(state, eventId, action) ??
  resolveHiddenEvent(state, eventId, action, random) ??
  resolveSystemEvent(state, eventId, action) ??
  resolveRareEvent(state, eventId, action, random) ??
  resolveHellEvent(state, eventId, action) ??
  resolveSpecialEvent(state, eventId, action, random) ??
  resolveInputNormalEvent(state, eventId, action, random) ??
  resolveNormalEvent(state, eventId, action, random)


export const prepareRegisteredEvent = (
  state: GameState,
  eventId: EventId,
  random: EventRandomSource = Math.random,
): void => {
  prepareBlessingEvent(state, eventId, random)
  prepareSpecialEvent(state, eventId)
}
