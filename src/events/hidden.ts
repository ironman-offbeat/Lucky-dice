import type { EventId, GameState } from '../game/GameState'
import {
  changeGainBonus,
  grantCoin,
} from '../game/EconomyEngine'
import { applyEventStageDelta } from '../game/GameEngine'
import { applyBlessing } from '../game/BlessingEngine'
import type { EventRandomSource } from './schedule'
import type { EventAction, EventResolution } from './types'

const normalizeRandom = (random: EventRandomSource): number =>
  Math.min(0.999999999999, Math.max(0, random()))

const resolveHiddenZero = (
  state: GameState,
  action: EventAction,
): EventResolution => {
  if (action.choiceId !== 'continue') {
    throw new Error('Invalid hidden-zero action.')
  }

  const stageBefore = state.progress.stage
  if (state.progress.stage !== 0) {
    applyEventStageDelta(state, -state.progress.stage)
  }

  state.dice.modifier += 2

  return {
    eventId: 'hidden-zero',
    title: '세상의 밖',
    message:
      '어둠 속에서 시간의 흐름이 뒤틀렸습니다. STAGE ' +
      stageBefore +
      ' → 0. 새롭게 의지를 다지며 주사위 보정 +2.',
  }
}

const resolveFirstHidden = (
  state: GameState,
  action: EventAction,
  random: EventRandomSource,
): EventResolution => {
  if (action.choiceId === 'look-forward') {
    const change = grantCoin(
      state,
      3,
      { triggerCompound: true },
    )

    return {
      eventId: -1,
      title: '여정에 대한 생각',
      message:
        '앞으로의 여정을 기대했습니다. 바닥에서 코인 3개를 발견했습니다. COIN ' +
        change.coinBefore +
        ' → ' +
        change.coinAfter +
        '.',
    }
  }

  if (action.choiceId === 'worry') {
    changeGainBonus(state, 1)

    return {
      eventId: -1,
      title: '여정에 대한 생각',
      message:
        '앞으로의 여정을 걱정하며 더 침착해졌습니다. 획득 보너스 +1.',
    }
  }

  if (action.choiceId !== 'remember') {
    throw new Error('Invalid first-hidden-event action.')
  }

  const remembersStars = normalizeRandom(random) < 0.25
  const starsAvailable =
    state.blessings.available.includes('별들의 축복')

  if (remembersStars && starsAvailable) {
    const result = applyBlessing(state, '별들의 축복')

    return {
      eventId: -1,
      title: '과거의 기억 · 별',
      message:
        '별을 보던 하늘을 떠올렸고, 기억이 선명해지며 축복으로 이어졌습니다. ' +
        result.message,
    }
  }

  if (remembersStars) {
    return {
      eventId: -1,
      title: '과거의 기억 · 별',
      message:
        '별을 보던 하늘을 떠올렸습니다. 밤하늘의 별들은 이미 당신을 바라보고 있는 듯합니다.',
    }
  }

  return {
    eventId: -1,
    title: '과거의 기억',
    message:
      '과거를 떠올려 보았지만 특별한 기억은 생각나지 않았습니다. 다시 여정을 시작합니다.',
  }
}

export const resolveHiddenEvent = (
  state: GameState,
  eventId: EventId,
  action: EventAction,
  random: EventRandomSource = Math.random,
): EventResolution | null => {
  if (eventId === 'hidden-zero') {
    return resolveHiddenZero(state, action)
  }

  if (eventId === -1) {
    return resolveFirstHidden(state, action, random)
  }

  return null
}