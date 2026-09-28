import type { GameState } from './GameState'
import { grantCoin, spendCoin, canAfford } from './EconomyEngine'
import type { EventRandomSource } from '../events/schedule'

export interface RouletteResult {
  digits: [number, number, number]
  reward: number
  jackpot: boolean
  label: string
}

const normalizeRandom = (random: EventRandomSource): number =>
  Math.min(0.999999999999, Math.max(0, random()))

const rollDigit = (random: EventRandomSource): number =>
  1 + Math.floor(normalizeRandom(random) * 9)

export const spinRoulette = (
  state: GameState,
  random: EventRandomSource = Math.random,
  cost = 2,
): RouletteResult => {
  if (!canAfford(state, cost)) {
    throw new Error('Not enough coin to spin roulette.')
  }

  spendCoin(state, cost)

  const digits: [number, number, number] = [
    rollDigit(random),
    rollDigit(random),
    rollDigit(random),
  ]

  const counts = new Map<number, number>()
  for (const digit of digits) {
    counts.set(digit, (counts.get(digit) ?? 0) + 1)
  }

  const sameCount = Math.max(...counts.values())
  const sevenCount = digits.filter((digit) => digit === 7).length
  const jackpot = sevenCount === 3

  let reward = 0
  const labels: string[] = []

  if (jackpot) {
    reward += 77
    labels.push('777 JACKPOT +77')
  }

  if (sameCount === 1) {
    labels.push('꽝')
    if (sevenCount === 1) {
      reward += 1
      labels.push('싱글 세븐 +1')
    }
  } else if (sameCount === 2) {
    reward += 3
    labels.push('페어 +3')

    if (sevenCount === 1) {
      reward += 1
      labels.push('싱글 세븐 +1')
    } else if (sevenCount === 2) {
      reward += 2
      labels.push('더블 세븐 +2')
    }
  } else {
    reward += 10
    labels.push('트리플 +10')
  }

  if (reward > 0) {
    grantCoin(state, reward)
  }

  return {
    digits,
    reward,
    jackpot,
    label: labels.join(' · '),
  }
}
