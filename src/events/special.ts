import type { EventId, GameState } from '../game/GameState'
import {
  changeGainBonus,
  changeLossBonus,
  gainCoin,
  loseCoin,
  spendCoin,
} from '../game/EconomyEngine'
import type { EventRandomSource } from './schedule'
import type { EventAction, EventResolution } from './types'

type SimpleSpecialEventId = 50 | 51 | 53 | 55 | 66

const SIMPLE_SPECIAL_EVENT_IDS = new Set<EventId>([
  50,
  51,
  53,
  55,
  66,
])

const normalizeRandom = (random: EventRandomSource): number =>
  Math.min(0.999999999999, Math.max(0, random()))

const removeAccessory = (
  state: GameState,
  name: string,
): boolean => {
  const index = state.inventory.ownedAccessories.indexOf(name)
  if (index < 0) return false

  state.inventory.ownedAccessories.splice(index, 1)
  return true
}

const resolveDevilDeal = (
  state: GameState,
  action: EventAction,
): EventResolution => {
  if (action.choiceId === 'accept') {
    changeGainBonus(state, 1)
    changeLossBonus(state, 1)

    return {
      eventId: 50,
      title: '악마의 거래',
      message:
        '악마의 거래를 받아들였습니다. 획득 보너스 +1, 손실 보너스 +1.',
    }
  }

  if (action.choiceId !== 'reject') {
    throw new Error('Invalid devil-deal choice.')
  }

  return {
    eventId: 50,
    title: '악마의 거래',
    message: '악마의 거래를 거절했습니다.',
  }
}

const resolveOutlaw = (
  state: GameState,
  action: EventAction,
): EventResolution => {
  if (action.choiceId === 'pay') {
    const change = loseCoin(state, 2)

    return {
      eventId: 51,
      title: '강도 습격',
      message:
        `강도에게 코인 ${Math.abs(change.appliedAmount)}개를 지불했습니다. ` +
        `COIN ${change.coinBefore} → ${change.coinAfter}`,
    }
  }

  if (action.choiceId !== 'resist') {
    throw new Error('Invalid outlaw choice.')
  }

  state.dice.modifier -= 1

  return {
    eventId: 51,
    title: '강도 습격',
    message:
      '코인을 지불하지 않고 맞섰다가 부상을 입었습니다. 주사위 보정 -1.',
  }
}

const resolveCathedral = (
  state: GameState,
  action: EventAction,
): EventResolution => {
  if (action.choiceId === 'feather') {
    if (!removeAccessory(state, '천사의 깃털')) {
      throw new Error('Angel Feather is required for this cathedral action.')
    }

    const change = gainCoin(state, 10)
    changeLossBonus(state, -5)
    changeGainBonus(state, 2)

    return {
      eventId: 53,
      title: '성당 · 천사의 깃털',
      message:
        `천사의 깃털이 빛으로 사라졌습니다. 코인 ${change.appliedAmount}개 획득, ` +
        '손실 보너스 -5, 획득 보너스 +2. ' +
        `COIN ${change.coinBefore} → ${change.coinAfter}`,
    }
  }

  if (action.choiceId === 'purify') {
    if (state.economy.coinLossBonus <= 0) {
      throw new Error('Purification is not currently available.')
    }

    changeLossBonus(state, -1)

    return {
      eventId: 53,
      title: '성당 · 정화',
      message: '성직자의 정화를 받았습니다. 손실 보너스 -1.',
    }
  }

  if (action.choiceId === 'heal') {
    if (state.dice.modifier >= 0) {
      throw new Error('Healing is not currently available.')
    }

    state.dice.modifier += 1

    return {
      eventId: 53,
      title: '성당 · 치료',
      message: '성직자의 치료를 받았습니다. 주사위 보정 +1.',
    }
  }

  if (action.choiceId !== 'leave') {
    throw new Error('Invalid cathedral choice.')
  }

  const change = gainCoin(state, 1)

  return {
    eventId: 53,
    title: '성당',
    message:
      `성당을 나서며 코인 ${change.appliedAmount}개를 발견했습니다. ` +
      `COIN ${change.coinBefore} → ${change.coinAfter}`,
  }
}

const resolveTax = (
  state: GameState,
  action: EventAction,
  random: EventRandomSource,
): EventResolution => {
  if (state.blessings.owned.includes('명성의 축복')) {
    changeGainBonus(state, 1)

    return {
      eventId: 55,
      title: '세금 · 명성 면제',
      message:
        '세금징수원이 당신의 명성을 알아보고 세금을 면제했습니다. 획득 보너스 +1.',
    }
  }

  if (action.choiceId === 'pay') {
    const change = loseCoin(state, 2)

    return {
      eventId: 55,
      title: '세금',
      message:
        `정직하게 세금을 납부했습니다. 코인 ${Math.abs(change.appliedAmount)}개를 잃었습니다. ` +
        `COIN ${change.coinBefore} → ${change.coinAfter}`,
    }
  }

  if (action.choiceId !== 'flee') {
    throw new Error('Invalid tax choice.')
  }

  if (normalizeRandom(random) < 0.5) {
    const change = spendCoin(state, 1)

    return {
      eventId: 55,
      title: '세금 · 도주 성공',
      message:
        '세금징수원에게서 도망쳤지만 코인 1개를 떨어뜨렸습니다. ' +
        `COIN ${change.coinBefore} → ${change.coinAfter}`,
    }
  }

  const change = loseCoin(state, 2)
  changeLossBonus(state, 1)

  return {
    eventId: 55,
    title: '세금 · 도주 실패',
    message:
      `도주에 실패해 세금을 납부했습니다. 코인 ${Math.abs(change.appliedAmount)}개 손실, ` +
      '손실 보너스 +1. ' +
      `COIN ${change.coinBefore} → ${change.coinAfter}`,
  }
}

export const resolveSpecialEvent = (
  state: GameState,
  eventId: EventId,
  action: EventAction,
  random: EventRandomSource = Math.random,
): EventResolution | null => {
  if (!SIMPLE_SPECIAL_EVENT_IDS.has(eventId)) return null

  switch (eventId as SimpleSpecialEventId) {
    case 50:
      return resolveDevilDeal(state, action)
    case 51:
      return resolveOutlaw(state, action)
    case 53:
      return resolveCathedral(state, action)
    case 55:
      return resolveTax(state, action, random)
    case 66:
      return {
        eventId: 66,
        title: '지옥 · 고요',
        message:
          '불길 사이로 잠시 고요가 찾아왔습니다. 아무 일도 일어나지 않았습니다.',
      }
  }
}
