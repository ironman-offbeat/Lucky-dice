import type { GameState, MinigameState } from './GameState'
import { canAfford, spendCoin } from './EconomyEngine'
import { applyItemEffect } from './ItemEngine'
import { spinRoulette } from './RouletteEngine'
import { ITEM_IDS, getItemDefinition, type ItemId } from '../data/items'
import type { EventRandomSource } from '../events/schedule'
import type { EventAction, EventResolution } from '../events/types'

const normalizeRandom = (random: EventRandomSource): number =>
  Math.min(0.999999999999, Math.max(0, random()))

const sampleItems = (
  pool: readonly ItemId[],
  count: number,
  random: EventRandomSource,
): ItemId[] => {
  const source = [...pool]
  const result: ItemId[] = []

  while (result.length < count && source.length > 0) {
    const index = Math.floor(normalizeRandom(random) * source.length)
    result.push(source[index])
    source.splice(index, 1)
  }

  return result
}

const availableItems = (state: Readonly<GameState>): ItemId[] =>
  ITEM_IDS.filter(
    (id) => !state.inventory.ownedAccessories.includes(id),
  )

const ensureMarket = (
  state: GameState,
  random: EventRandomSource,
): MinigameState => {
  const current = state.event.minigame

  if (current?.kind === 'black-market') return current

  const offers = sampleItems(availableItems(state), 4, random)
  const market: MinigameState = {
    kind: 'black-market',
    phase: 'input',
    targetNumber: null,
    attemptsUsed: 0,
    maxAttempts: 1,
    expectedText: null,
    displayText: null,
    sequence: [],
    feedback: '수상한 상인이 물건들을 펼쳐 보였습니다.',
    marketOffers: offers,
    rouletteDigits: null,
  }

  state.event.minigame = market
  return market
}

const buyItem = (
  state: GameState,
  market: MinigameState,
  itemId: ItemId,
  random: EventRandomSource,
): EventResolution => {
  const offers = market.marketOffers ?? []

  if (!offers.includes(itemId)) {
    throw new Error('Item is not available in this black market.')
  }

  const item = getItemDefinition(itemId)

  if (!canAfford(state, item.price)) {
    market.feedback = `코인이 부족합니다. ${itemId} 가격은 ${item.price}코인입니다.`
    return {
      eventId: 54,
      title: '암시장',
      message: market.feedback,
      complete: false,
    }
  }

  spendCoin(state, item.price)
  const effect = applyItemEffect(state, itemId, random)
  market.marketOffers = offers.filter((offer) => offer !== itemId)
  market.feedback = `${itemId} 구매. ${effect.message}`

  return {
    eventId: 54,
    title: `암시장 · ${itemId}`,
    message: market.feedback,
    complete: effect.endEvent,
  }
}

export const resolveBlackMarketEvent = (
  state: GameState,
  action: EventAction,
  random: EventRandomSource = Math.random,
): EventResolution => {
  if (
    state.event.minigame?.kind !== 'black-market' &&
    action.choiceId === 'enter-market'
  ) {
    ensureMarket(state, random)

    return {
      eventId: 54,
      title: '암시장',
      message: '암시장에 들어섰습니다.',
      complete: false,
    }
  }

  const market = ensureMarket(state, random)

  if (action.choiceId.startsWith('buy-item:')) {
    const itemId = action.choiceId.slice('buy-item:'.length) as ItemId

    if (!ITEM_IDS.includes(itemId)) {
      throw new Error('Unknown black-market item.')
    }

    return buyItem(state, market, itemId, random)
  }

  if (action.choiceId === 'roulette') {
    if (!canAfford(state, 2)) {
      market.feedback = '코인이 부족합니다. 777 룰렛은 2코인입니다.'
      return {
        eventId: 54,
        title: '암시장 · 777 룰렛',
        message: market.feedback,
        complete: false,
      }
    }

    const result = spinRoulette(state, random, 2)
    market.rouletteDigits = result.digits
    market.feedback =
      `[${result.digits.join('][')}] · ${result.label} · 보상 +${result.reward}`

    return {
      eventId: 54,
      title: '암시장 · 777 룰렛',
      message: market.feedback,
      complete: false,
    }
  }

  if (action.choiceId !== 'leave-market') {
    throw new Error('Invalid black-market action.')
  }

  return {
    eventId: 54,
    title: '암시장',
    message: '암시장을 떠났습니다.',
  }
}
