import type { GameState } from './GameState'
import {
  changeGainBonus,
  changeLossBonus,
  grantCoin,
  multiplyCoin,
  setLossBonus,
} from './EconomyEngine'
import { applyEventStageDelta } from './GameEngine'
import {
  BLESSING_IDS,
  getBlessingDescription,
  type BlessingId,
} from '../data/blessings'
import type { EventRandomSource } from '../events/schedule'

export interface BlessingEffectResult {
  id: BlessingId
  message: string
}

const normalizeRandom = (random: EventRandomSource): number =>
  Math.min(0.999999999999, Math.max(0, random()))

const isBlessingId = (value: string): value is BlessingId =>
  BLESSING_IDS.includes(value as BlessingId)

const sampleUnique = (
  pool: readonly BlessingId[],
  count: number,
  random: EventRandomSource,
): BlessingId[] => {
  const source = [...pool]
  const result: BlessingId[] = []

  while (result.length < count && source.length > 0) {
    const index = Math.floor(normalizeRandom(random) * source.length)
    result.push(source[index])
    source.splice(index, 1)
  }

  return result
}

const availableBlessings = (
  state: Readonly<GameState>,
): BlessingId[] =>
  state.blessings.available.filter(isBlessingId)

const removeFromAvailable = (
  state: GameState,
  id: BlessingId,
): void => {
  const index = state.blessings.available.indexOf(id)
  if (index >= 0) {
    state.blessings.available.splice(index, 1)
  }
}

const addOwnedBlessing = (
  state: GameState,
  id: BlessingId,
): void => {
  if (!state.blessings.owned.includes(id)) {
    state.blessings.owned.push(id)
  }
}

export const prepareThresholdBlessingOffers = (
  state: GameState,
  random: EventRandomSource = Math.random,
): BlessingId[] => {
  const available = availableBlessings(state)

  // Preserve the legacy pool behavior: the final remaining blessing is not
  // eligible for the regular 100-stage blessing event.
  const candidates =
    available.length > 1
      ? available.slice(0, -1)
      : available

  const offers = sampleUnique(
    candidates,
    Math.min(3, candidates.length),
    random,
  )

  state.event.blessingOffers = offers
  return offers
}

export const prepareStarBlessingOffer = (
  state: GameState,
  random: EventRandomSource = Math.random,
): BlessingId[] => {
  if (state.progress.stage > 300) {
    state.event.blessingOffers = []
    return []
  }

  const available = availableBlessings(state)

  // Preserve starevent(): randint(1, i) excluded the first available entry
  // while allowing the last entry (notably Swift Blessing).
  const candidates =
    available.length > 1
      ? available.slice(1)
      : available

  const offers = sampleUnique(
    candidates,
    Math.min(1, candidates.length),
    random,
  )

  state.event.blessingOffers = offers
  return offers
}

export const clearBlessingOffers = (
  state: GameState,
): void => {
  state.event.blessingOffers = []
}

export const rejectThresholdBlessing = (
  state: GameState,
): BlessingEffectResult => {
  changeGainBonus(state, -1)
  changeLossBonus(state, 1)

  return {
    id: '복리의 축복',
    message:
      '축복을 거절해 신들의 분노를 샀습니다. 획득 보너스 -1, 손실 보너스 +1.',
  }
}

export const applyBlessing = (
  state: GameState,
  id: BlessingId,
): BlessingEffectResult => {
  if (!state.blessings.available.includes(id)) {
    throw new Error(`Blessing is not available: ${id}`)
  }

  removeFromAvailable(state, id)
  addOwnedBlessing(state, id)

  switch (id) {
    case '복리의 축복':
      state.blessings.compoundActive = true
      return {
        id,
        message:
          '복리의 축복을 받았습니다. 앞으로 코인을 획득할 때마다 획득 보너스가 +0.2 증가합니다.',
      }

    case '탐욕의 축복':
      grantCoin(state, 999)
      changeLossBonus(state, 100)
      return {
        id,
        message:
          '탐욕의 축복을 받았습니다. 코인 +999, 손실 보너스 +100.',
      }

    case '회귀의 축복': {
      const move = applyEventStageDelta(
        state,
        -state.progress.stage,
      )

      return {
        id,
        message:
          `회귀의 축복을 받았습니다. STAGE ${move.stageBefore} → 0.`,
      }
    }

    case 'J의 축복': {
      const change = multiplyCoin(state, 1.5)

      return {
        id,
        message:
          `J의 축복을 받았습니다. 현재 코인이 50% 증가했습니다. COIN ${change.coinBefore} → ${change.coinAfter}.`,
      }
    }

    case '주사위의 축복':
      state.dice.specialDiceAvailable = true
      return {
        id,
        message:
          '주사위의 축복을 받았습니다. 원하는 순간 한 번, 1~50 중 원하는 이동거리를 선택할 수 있습니다.',
      }

    case '안개의 축복': {
      const lossBefore = state.economy.coinLossBonus
      const diceBefore = state.dice.modifier

      setLossBonus(
        state,
        Math.max(0, lossBefore - 10),
      )

      if (state.dice.modifier < -10) {
        state.dice.modifier += 10
      } else if (state.dice.modifier <= 0) {
        state.dice.modifier = 0
      }

      return {
        id,
        message:
          `안개의 축복을 받았습니다. 손실 보너스 ${lossBefore} → ${state.economy.coinLossBonus}, 주사위 보정 ${diceBefore} → ${state.dice.modifier}.`,
      }
    }

    case '별들의 축복':
      state.blessings.starBlessingActive = true

      for (
        let stage = Math.max(0, state.progress.stage);
        stage < 300;
        stage += 1
      ) {
        if (stage % 5 === 0) {
          state.event.schedule[stage] = 49
        }
      }

      return {
        id,
        message:
          '별들의 축복을 받았습니다. Stage 300 이전의 5단위 지점에 축복의 별 이벤트가 추가됩니다.',
      }

    case '명성의 축복':
      state.blessings.fameEventsRemaining = 3
      return {
        id,
        message:
          '명성의 축복을 받았습니다. 앞으로 3번의 이벤트가 유명한 자의 길로 확정됩니다.',
      }

    case '신속의 축복': {
      const move = applyEventStageDelta(
        state,
        300 - state.progress.stage,
      )

      return {
        id,
        message:
          `신속의 축복을 받았습니다. STAGE ${move.stageBefore} → 300.`,
      }
    }
  }
}

export const consumeSpecialDice = (
  state: GameState,
  value: number,
): void => {
  if (!state.dice.specialDiceAvailable) {
    throw new Error('Special 50-sided die is not available.')
  }

  if (!Number.isInteger(value) || value < 1 || value > 50) {
    throw new Error('Special die value must be an integer from 1 to 50.')
  }

  state.dice.forcedMove = value
  state.dice.specialDiceAvailable = false
}

export const blessingChoiceDescription = (
  id: BlessingId,
): string => getBlessingDescription(id)
