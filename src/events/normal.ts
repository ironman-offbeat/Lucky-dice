import type { EventId, GameState } from '../game/GameState'
import {
  changeGainBonus,
  changeLossBonus,
  gainCoin,
  grantCoin,
  loseCoin,
  setCoin,
  setMinimumGainBonus,
  spendCoin,
  type CoinChangeResult,
} from '../game/EconomyEngine'
import { applyEventStageDelta } from '../game/GameEngine'
import type { EventRandomSource } from './schedule'
import type { EventAction, EventResolution } from './types'

type ImplementedNormalEventId = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 11 | 12 | 13 | 14
type NormalEventHandler = (
  state: GameState,
  action: EventAction,
  random: EventRandomSource,
) => EventResolution

const IMPLEMENTED_NORMAL_EVENT_IDS = new Set<EventId>([1,2,3,4,5,6,8,11,12,13,14])

const normalizeRandom = (random: EventRandomSource): number =>
  Math.min(0.999999999999, Math.max(0, random()))

const randomIntInclusive = (min: number, max: number, random: EventRandomSource): number =>
  min + Math.floor(normalizeRandom(random) * (max - min + 1))

const formatNumber = (value: number): string =>
  Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000)

const coinTransition = (before: number, after: number): string =>
  `COIN ${formatNumber(before)} → ${formatNumber(after)}`

const coinChangeTransition = (change: CoinChangeResult): string =>
  coinTransition(change.coinBefore, change.coinAfter)

const addAccessory = (state: GameState, name: string): boolean => {
  if (state.inventory.ownedAccessories.includes(name)) return false
  state.inventory.ownedAccessories.push(name)
  return true
}

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
      coinChangeTransition(change) +
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
      coinChangeTransition(change),
  }
}

const resolveGambling: NormalEventHandler = (state, action, random) => {
  const title = '도박장'

  if (state.economy.coin < 1) {
    const before = state.economy.coin
    const won = normalizeRandom(random) >= 0.5
    if (!won) {
      setCoin(state, 0)
      return { eventId: 4, title, message: '남은 코인을 전부 걸었지만 실패했습니다. ' + coinTransition(before, state.economy.coin) }
    }

    setCoin(state, 1)
    const gotBeggarCoin = addAccessory(state, '거지코인')
    if (gotBeggarCoin) changeLossBonus(state, -1)
    return {
      eventId: 4,
      title,
      message:
        '전 재산 도박에 성공해 코인이 1이 되었습니다. ' +
        coinTransition(before, state.economy.coin) +
        (gotBeggarCoin ? ' · 거지코인 획득: 손실 보너스 -1' : ''),
    }
  }

  const wager = action.numericValue
  if (
    action.choiceId !== 'wager' ||
    wager === undefined ||
    !Number.isInteger(wager) ||
    wager < 1 ||
    wager > Math.floor(state.economy.coin)
  ) {
    throw new Error('Invalid gambling wager.')
  }

  const before = state.economy.coin
  spendCoin(state, wager)
  const outcome = randomIntInclusive(1, 100, random)
  let outcomeText = ''

  if (outcome <= 33) {
    grantCoin(state, wager * 0.5)
    outcomeText = '아이고 당첨: 건 돈의 0.5배를 돌려받았습니다.'
  } else if (outcome === 34) {
    grantCoin(state, wager * 20)
    outcomeText = '초대박 당첨: 건 돈의 20배를 받았습니다.'
  } else if (outcome <= 67) {
    outcomeText = '실패: 건 돈을 모두 잃었습니다.'
    if (wager >= 10 && addAccessory(state, '도파민 중독 자격증')) {
      grantCoin(state, 1)
      outcomeText += ' · 도파민 중독 자격증 획득: 코인 +1'
    }
  } else {
    grantCoin(state, wager * 2)
    outcomeText = '대박 당첨: 건 돈의 2배를 받았습니다.'
    if (wager >= 10 && addAccessory(state, '도박사 자격증')) {
      changeGainBonus(state, 1)
      setMinimumGainBonus(state, 1)
      outcomeText += ' · 도박사 자격증 획득: 획득 보너스 +1, 최소 획득 보너스 1'
    }
  }

  return { eventId: 4, title, message: `${outcomeText} ${coinTransition(before, state.economy.coin)}` }
}

const resolveTaxi: NormalEventHandler = (state, action, random) => {
  if (action.choiceId === 'skip') {
    return { eventId: 5, title: '택시 아저씨', message: '택시에 타지 않고 여정을 계속합니다.' }
  }
  if (action.choiceId !== 'ride') throw new Error('Invalid taxi choice.')

  const coinChange = spendCoin(state, 1)
  const distance = randomIntInclusive(1, 10, random)
  const stageMove = applyEventStageDelta(state, distance)
  return {
    eventId: 5,
    title: '택시 아저씨',
    message:
      `코인 1개를 지불하고 택시로 Stage ${distance}을 이동했습니다. ` +
      `STAGE ${stageMove.stageBefore} → ${stageMove.stageAfter} · ` +
      coinChangeTransition(coinChange),
  }
}

const resolveAngel: NormalEventHandler = (state, action, random) => {
  const selected = Number(action.choiceId)
  if (!Number.isInteger(selected) || selected < 1 || selected > 3) {
    throw new Error('Invalid angel dice selection.')
  }

  state.dice.forcedMove = selected
  const featherDropped = normalizeRandom(random) < 0.1 && addAccessory(state, '천사의 깃털')
  return {
    eventId: 6,
    title: '천사의 축복',
    message:
      `천사가 다음 이동거리를 ${selected}로 고정했습니다.` +
      (featherDropped ? ' · 천사의 깃털 획득: 기본 1~6 주사위에서 50% 확률로 +1' : ''),
  }
}

const resolveDragon: NormalEventHandler = (state, action, random) => {
  if (action.choiceId === 'run') {
    changeLossBonus(state, 1)
    return {
      eventId: 8,
      title: '무언가 낙하',
      message: '억지로 주사위를 굴려 안전한 곳으로 도망쳤습니다. 손실 보너스가 +1 증가했습니다.',
    }
  }
  if (action.choiceId !== 'wait') throw new Error('Invalid dragon event choice.')

  const outcome = randomIntInclusive(1, 20, random)
  if (outcome === 1) {
    const change = loseCoin(state, 10)
    return {
      eventId: 8,
      title: '무언가 낙하',
      message:
        `거대한 존재가 내려와 급히 도망쳤습니다. 코인 ${formatNumber(Math.abs(change.appliedAmount))}개를 잃었습니다. ` +
        coinChangeTransition(change),
    }
  }
  if (outcome === 2) {
    const change = spendCoin(state, 100)
    return {
      eventId: 8,
      title: '붉은 용',
      message: '그것은 붉은 용이었습니다. 불길을 코인으로 막아 코인 100개를 잃었습니다. ' + coinChangeTransition(change),
    }
  }

  return {
    eventId: 8,
    title: '무언가 낙하',
    message: '거대한 존재는 당신을 눈치채지 못한 채 지나쳐 날아갔습니다. 아무 일도 일어나지 않았습니다.',
  }
}

const resolveWindSpirit: NormalEventHandler = (state, action) => {
  const selected = Number(action.choiceId)
  if (!Number.isInteger(selected) || selected < 1 || selected > 6) {
    throw new Error('Invalid wind spirit dice selection.')
  }
  state.dice.forcedMove = selected
  return { eventId: 14, title: '바람의 정령', message: `바람의 정령이 다음 이동거리를 ${selected}로 고정했습니다.` }
}

const handlers: Record<ImplementedNormalEventId, NormalEventHandler> = {
  1: (state, _action, random) =>
    normalizeRandom(random) < 0.5
      ? gainResolution(state, 1, '맞장뜨기', 2, '간신히 싸움에서 이겨냈습니다.')
      : lossResolution(state, 1, '맞장뜨기', 2, '싸움에서 패배했습니다.'),
  2: (state) => lossResolution(state, 2, '삥 뜯기기', 1, '길에서 코인을 빼앗겼습니다.'),
  3: (state) => gainResolution(state, 3, '코인 줍기', 1, '길에서 우연히 코인을 발견했습니다.'),
  4: resolveGambling,
  5: resolveTaxi,
  6: resolveAngel,
  8: resolveDragon,
  11: (state) => gainResolution(state, 11, '코인뭉치', 2, '바닥에서 코인뭉치를 발견했습니다.'),
  12: (state) => gainResolution(state, 12, '코인주머니', 3, '묵직한 코인주머니를 발견했습니다.'),
  13: (state) => lossResolution(state, 13, '코인 털리기', 2, '깡패에게 코인을 털렸습니다.'),
  14: resolveWindSpirit,
}

const isImplementedNormalEventId = (eventId: EventId): eventId is ImplementedNormalEventId =>
  IMPLEMENTED_NORMAL_EVENT_IDS.has(eventId)

export const resolveNormalEvent = (
  state: GameState,
  eventId: EventId,
  action: EventAction,
  random: EventRandomSource = Math.random,
): EventResolution | null => {
  if (!isImplementedNormalEventId(eventId)) return null
  return handlers[eventId](state, action, random)
}
