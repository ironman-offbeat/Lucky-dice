import type { EventId, GameState } from '../game/GameState'
import type { EventAction, EventResolution } from './types'

export const resolveSystemEvent = (
  _state: GameState,
  eventId: EventId,
  action: EventAction,
): EventResolution | null => {
  if (eventId !== 0) return null

  if (action.choiceId !== 'continue') {
    throw new Error('Invalid rest-event action.')
  }

  return {
    eventId: 0,
    title: '쉬어가기',
    message:
      '특별한 사건 없이 잠시 숨을 고르고 다음 여정을 준비합니다.',
  }
}