import type { EventId, GameState } from '../game/GameState'
import {
  applyBlessing,
  clearBlessingOffers,
  prepareStarBlessingOffer,
  prepareThresholdBlessingOffers,
  rejectThresholdBlessing,
} from '../game/BlessingEngine'
import {
  changeGainBonus,
  changeLossBonus,
} from '../game/EconomyEngine'
import { BLESSING_IDS, type BlessingId } from '../data/blessings'
import type { EventRandomSource } from './schedule'
import type { EventAction, EventResolution } from './types'

const isBlessingId = (value: string): value is BlessingId =>
  BLESSING_IDS.includes(value as BlessingId)

export const prepareBlessingEvent = (
  state: GameState,
  eventId: EventId,
  random: EventRandomSource = Math.random,
): void => {
  if (eventId === 'blessing') {
    prepareThresholdBlessingOffers(state, random)
    return
  }

  if (eventId === 49) {
    prepareStarBlessingOffer(state, random)
  }
}

const resolveThresholdBlessing = (
  state: GameState,
  action: EventAction,
): EventResolution => {
  if (
    state.event.blessingOffers.length === 0 &&
    action.choiceId === 'continue-blessing'
  ) {
    return {
      eventId: 'blessing',
      title: '축복 이벤트',
      message: '더 이상 받을 수 있는 축복 후보가 남아 있지 않습니다.',
    }
  }

  if (action.choiceId === 'reject-blessing') {
    const result = rejectThresholdBlessing(state)
    clearBlessingOffers(state)

    return {
      eventId: 'blessing',
      title: '축복 이벤트',
      message: result.message,
    }
  }

  if (!action.choiceId.startsWith('blessing:')) {
    throw new Error('Invalid blessing choice.')
  }

  const id = action.choiceId.slice('blessing:'.length)

  if (
    !isBlessingId(id) ||
    !state.event.blessingOffers.includes(id)
  ) {
    throw new Error('Selected blessing is not currently offered.')
  }

  const result = applyBlessing(state, id)
  clearBlessingOffers(state)

  return {
    eventId: 'blessing',
    title: id,
    message: result.message,
  }
}

const resolveStarBlessing = (
  state: GameState,
  action: EventAction,
): EventResolution => {
  if (
    state.progress.stage > 300 ||
    state.event.blessingOffers.length === 0
  ) {
    if (action.choiceId !== 'continue-star') {
      throw new Error('Invalid empty-star choice.')
    }

    clearBlessingOffers(state)

    return {
      eventId: 49,
      title: '축복의 별',
      message:
        '추락한 별을 발견했지만 이곳의 열기와 악마들로 인해 별 안에는 아무것도 남아 있지 않았습니다.',
    }
  }

  if (action.choiceId === 'ignore-star') {
    clearBlessingOffers(state)

    return {
      eventId: 49,
      title: '축복의 별',
      message: '별 속의 축복을 받지 않고 발걸음을 옮겼습니다.',
    }
  }

  if (!action.choiceId.startsWith('blessing:')) {
    throw new Error('Invalid star-blessing choice.')
  }

  const id = action.choiceId.slice('blessing:'.length)

  if (
    !isBlessingId(id) ||
    !state.event.blessingOffers.includes(id)
  ) {
    throw new Error('Selected star blessing is not currently offered.')
  }

  const result = applyBlessing(state, id)
  clearBlessingOffers(state)

  return {
    eventId: 49,
    title: '축복의 별 · ' + id,
    message: result.message,
  }
}

const resolveFameEvent = (
  state: GameState,
  action: EventAction,
): EventResolution => {
  switch (action.choiceId) {
    case 'fame-dice':
      state.dice.modifier += 1
      return {
        eventId: 'fame',
        title: '유명한 자의 길',
        message:
          '상인들이 당신의 여정을 후원했습니다. 주사위 보정 +1.',
      }

    case 'fame-loss':
      changeLossBonus(state, -1)
      return {
        eventId: 'fame',
        title: '유명한 자의 길',
        message:
          '시민들이 당신의 여정을 축복했습니다. 손실 보너스 -1.',
      }

    case 'fame-gain':
      changeGainBonus(state, 1)
      return {
        eventId: 'fame',
        title: '유명한 자의 길',
        message:
          '시인들이 당신의 여정을 이야기합니다. 획득 보너스 +1.',
      }

    default:
      throw new Error('Invalid fame-event choice.')
  }
}

export const resolveBlessingEvent = (
  state: GameState,
  eventId: EventId,
  action: EventAction,
): EventResolution | null => {
  if (eventId === 'blessing') {
    return resolveThresholdBlessing(state, action)
  }

  if (eventId === 'fame') {
    return resolveFameEvent(state, action)
  }

  if (eventId === 49) {
    return resolveStarBlessing(state, action)
  }

  return null
}
