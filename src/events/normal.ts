import type { EventId, GameState } from '../game/GameState'
import {
  gainCoin,
  loseCoin,
  type CoinChangeResult,
} from '../game/EconomyEngine'
import type { EventRandomSource } from './schedule'
import type { EventResolution } from './types'

type ImplementedNormalEventId = 1 | 2 | 3 | 11 | 12 | 13

type NormalEventHandler = (
  state: GameState,
  random: EventRandomSource,
) => EventResolution

const IMPLEMENTED_NORMAL_EVENT_IDS = new Set<EventId>([
  1,
  2,
  3,
  11,
  12,
  13,
])

const normalizeRandom = (random: EventRandomSource): number =>
  Math.min(0.999999999999, Math.max(0, random()))

const formatNumber = (value: number): string =>
  Number.isInteger(value)
    ? String(value)
    : String(Math.round(value * 1000) / 1000)

const coinTransition = (change: CoinChangeResult): string =>
  `COIN ${formatNumber(change.coinBefore)} → ${formatNumber(change.coinAfter)}`

const gainResolution = (
  state: GameState,
  eventId: ImplementedNormalEventId,
  title: string,
  baseAmount: number,
  flavor: string,
): EventResolution => {
  const change = gainCoin(state, baseAmount)

  return {
    eventId,
    title,
    message:
      `${flavor} 코인 ${formatNumber(change.appliedAmount)}개를 얻었습니다. ` +
      coinTransition(change) +
      (change.compoundIncrease > 0
        ? ` · 복리로 획득 보너스 +${formatNumber(change.compoundIncrease)}`
        : ''),
  }
}

const lossResolution = (
  state: GameState,
  eventId: ImplementedNormalEventId,
  title: string,
  baseAmount: number,
  flavor: string,
): EventResolution => {
  const change = loseCoin(state, baseAmount)

  return {
    eventId,
    title,
    message:
      `${flavor} 코인 ${formatNumber(Math.abs(change.appliedAmount))}개를 잃었습니다. ` +
      coinTransition(change),
  }
}

const handlers: Record<ImplementedNormalEventId, NormalEventHandler> = {
  1: (state, random) => {
    const won = normalizeRandom(random) < 0.5

    if (won) {
      return gainResolution(
        state,
        1,
        '맞장뜨기',
        2,
        '간신히 싸움에서 이겨냈습니다.',
      )
    }

    return lossResolution(
      state,
      1,
      '맞장뜨기',
      2,
      '싸움에서 패배했습니다.',
    )
  },
  2: (state) =>
    lossResolution(
      state,
      2,
      '삥 뜯기기',
      1,
      '길에서 코인을 빼앗겼습니다.',
    ),
  3: (state) =>
    gainResolution(
      state,
      3,
      '코인 줍기',
      1,
      '길에서 우연히 코인을 발견했습니다.',
    ),
  11: (state) =>
    gainResolution(
      state,
      11,
      '코인뭉치',
      2,
      '바닥에서 코인뭉치를 발견했습니다.',
    ),
  12: (state) =>
    gainResolution(
      state,
      12,
      '코인주머니',
      3,
      '묵직한 코인주머니를 발견했습니다.',
    ),
  13: (state) =>
    lossResolution(
      state,
      13,
      '코인 털리기',
      2,
      '깡패에게 코인을 털렸습니다.',
    ),
}

const isImplementedNormalEventId = (
  eventId: EventId,
): eventId is ImplementedNormalEventId =>
  IMPLEMENTED_NORMAL_EVENT_IDS.has(eventId)

export const resolveNormalEvent = (
  state: GameState,
  eventId: EventId,
  random: EventRandomSource = Math.random,
): EventResolution | null => {
  if (!isImplementedNormalEventId(eventId)) return null
  return handlers[eventId](state, random)
}
