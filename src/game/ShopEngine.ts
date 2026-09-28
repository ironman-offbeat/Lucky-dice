import type { GameState, MinigameState } from '../game/GameState'
import {
  canAfford,
  changeGainBonus,
  gainCoin,
  grantCoin,
  spendCoin,
} from '../game/EconomyEngine'
import type { EventRandomSource } from '../events/schedule'
import type { EventAction, EventResolution } from '../events/types'

const normalizeRandom = (random: EventRandomSource): number =>
  Math.min(0.999999999999, Math.max(0, random()))

const randomIntInclusive = (
  min: number,
  max: number,
  random: EventRandomSource,
): number =>
  min + Math.floor(normalizeRandom(random) * (max - min + 1))

const sampleUniqueNumbers = (
  count: number,
  min: number,
  max: number,
  random: EventRandomSource,
): number[] => {
  const pool = Array.from(
    { length: max - min + 1 },
    (_, index) => min + index,
  )

  const picked: number[] = []

  while (picked.length < count) {
    const index = randomIntInclusive(0, pool.length - 1, random)
    picked.push(pool[index])
    pool.splice(index, 1)
  }

  return picked
}

const formatNumber = (value: number): string =>
  Number.isInteger(value)
    ? String(value)
    : String(Math.round(value * 1000) / 1000)

export const prepareShopEvent = (
  state: GameState,
): void => {
  gainCoin(state, 2)
}

export const getShopPrice = (
  state: Readonly<GameState>,
  product: 'dice' | 'gain' | 'lottery',
): number => {
  const base =
    product === 'dice'
      ? 3
      : product === 'gain'
        ? 6
        : 4

  return base + state.economy.coinLossBonus
}

const beginLottery = (
  state: GameState,
  random: EventRandomSource,
): EventResolution => {
  const price = getShopPrice(state, 'lottery')

  if (!canAfford(state, price)) {
    return {
      eventId: 52,
      title: '상점 · J의 복권',
      message: `코인이 부족합니다. J의 복권 가격은 ${formatNumber(price)}코인입니다. 상점을 나왔습니다.`,
    }
  }

  spendCoin(state, price)

  const draw = sampleUniqueNumbers(7, 1, 45, random)
  const minigame: MinigameState = {
    kind: 'lottery',
    phase: 'input',
    targetNumber: null,
    attemptsUsed: 0,
    maxAttempts: 1,
    expectedText: null,
    displayText: null,
    sequence: [],
    feedback: '1~45 중 서로 다른 숫자 6개를 선택하세요.',
    selectedNumbers: [],
    drawNumbers: draw.slice(0, 6).sort((a, b) => a - b),
    bonusNumber: draw[6],
  }

  state.event.minigame = minigame

  return {
    eventId: 52,
    title: '상점 · J의 복권',
    message: 'J의 복권을 구매했습니다. 숫자 6개를 선택하세요.',
    complete: false,
  }
}

const resolveLottery = (
  state: GameState,
): EventResolution => {
  const minigame = state.event.minigame

  if (
    !minigame ||
    minigame.kind !== 'lottery' ||
    minigame.drawNumbers === undefined ||
    minigame.bonusNumber === undefined ||
    minigame.selectedNumbers === undefined
  ) {
    throw new Error('Lottery minigame is not ready.')
  }

  const selected = minigame.selectedNumbers
  const drawNumbers = minigame.drawNumbers
  const bonusNumber = minigame.bonusNumber

  if (
    selected.length !== 6 ||
    new Set(selected).size !== 6 ||
    selected.some((value) => value < 1 || value > 45)
  ) {
    throw new Error('Exactly six unique lottery numbers are required.')
  }

  const mainMatches = selected.filter(
    (value) => drawNumbers.includes(value),
  ).length
  const bonusHit = selected.includes(bonusNumber)
  const rewardUnit = 4 + state.economy.coinGainBonus
  const reward =
    mainMatches * rewardUnit +
    (bonusHit ? rewardUnit : 0)

  const coinBefore = state.economy.coin
  if (reward > 0) {
    grantCoin(state, reward, { triggerCompound: true })
  }

  return {
    eventId: 52,
    title: '상점 · J의 복권 결과',
    message:
      `선택: ${[...selected].sort((a, b) => a - b).join(', ')} · ` +
      `당첨: ${drawNumbers.join(', ')} · 보너스 ${bonusNumber}. ` +
      `일치 ${mainMatches}개${bonusHit ? ' + 보너스' : ''}. ` +
      `코인 ${formatNumber(reward)}개 획득. COIN ${formatNumber(coinBefore)} → ${formatNumber(state.economy.coin)}`,
  }
}

export const resolveShopEvent = (
  state: GameState,
  action: EventAction,
  random: EventRandomSource = Math.random,
): EventResolution => {
  if (
    state.event.minigame?.kind === 'lottery' &&
    action.choiceId === 'lottery-submit'
  ) {
    return resolveLottery(state)
  }

  if (action.choiceId === 'buy-dice') {
    const price = getShopPrice(state, 'dice')

    if (!canAfford(state, price)) {
      return {
        eventId: 52,
        title: '상점',
        message: `코인이 부족합니다. 주사위 강화 가격은 ${formatNumber(price)}코인입니다. 상점을 나왔습니다.`,
      }
    }

    spendCoin(state, price)
    state.dice.modifier += 1

    return {
      eventId: 52,
      title: '상점',
      message:
        `코인 ${formatNumber(price)}개를 내고 주사위 보정 +1을 구매했습니다.`,
    }
  }

  if (action.choiceId === 'buy-gain') {
    const price = getShopPrice(state, 'gain')

    if (!canAfford(state, price)) {
      return {
        eventId: 52,
        title: '상점',
        message: `코인이 부족합니다. 획득 보너스 강화 가격은 ${formatNumber(price)}코인입니다. 상점을 나왔습니다.`,
      }
    }

    spendCoin(state, price)
    changeGainBonus(state, 0.5)

    return {
      eventId: 52,
      title: '상점',
      message:
        `코인 ${formatNumber(price)}개를 내고 획득 보너스 +0.5를 구매했습니다.`,
    }
  }

  if (action.choiceId === 'buy-lottery') {
    if (!state.blessings.owned.includes('J의 축복')) {
      throw new Error('J blessing is required to buy the lottery.')
    }

    return beginLottery(state, random)
  }

  if (action.choiceId !== 'leave') {
    throw new Error('Invalid shop choice.')
  }

  return {
    eventId: 52,
    title: '상점',
    message: '아무것도 사지 않고 상점을 나왔습니다.',
  }
}
