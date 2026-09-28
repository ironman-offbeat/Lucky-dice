import type { EventId, GameState, MinigameState } from '../game/GameState'
import { spinRoulette } from '../game/RouletteEngine'
import type { EventRandomSource } from './schedule'
import type { EventAction, EventResolution } from './types'

const RARE_ROULETTE_EVENT_ID: EventId = 77
const MAX_SPINS = 3

const ensureRareRoulette = (
  state: GameState,
): MinigameState => {
  const current = state.event.minigame

  if (current?.kind === 'rare-roulette') return current

  const minigame: MinigameState = {
    kind: 'rare-roulette',
    phase: 'input',
    targetNumber: null,
    attemptsUsed: 0,
    maxAttempts: MAX_SPINS,
    expectedText: null,
    displayText: null,
    sequence: [],
    feedback: '숲속 룰렛머신이 깨어났습니다. 최대 3번 무료로 돌릴 수 있습니다.',
    rouletteDigits: null,
  }

  state.event.minigame = minigame
  return minigame
}

const spinRareRoulette = (
  state: GameState,
  random: EventRandomSource,
): EventResolution => {
  const minigame = ensureRareRoulette(state)

  if (minigame.attemptsUsed >= minigame.maxAttempts) {
    return {
      eventId: 77,
      title: '777 룰렛',
      message: '모든 기회를 소진했습니다. 룰렛머신이 더 이상 작동하지 않습니다.',
    }
  }

  const result = spinRoulette(state, random, 0)
  minigame.attemptsUsed += 1
  minigame.rouletteDigits = result.digits

  const remaining =
    minigame.maxAttempts - minigame.attemptsUsed

  const resultText =
    `[${result.digits.join('][')}] · ${result.label} · 보상 +${result.reward}`

  if (remaining <= 0) {
    return {
      eventId: 77,
      title: '777 룰렛',
      message:
        `${resultText}. 모든 3번의 기회를 소진했습니다. 룰렛머신이 멈췄습니다.`,
    }
  }

  minigame.feedback =
    `${resultText}. 남은 기회 ${remaining}회.`

  return {
    eventId: 77,
    title: '777 룰렛',
    message: minigame.feedback,
    complete: false,
  }
}

export const resolveRareEvent = (
  state: GameState,
  eventId: EventId,
  action: EventAction,
  random: EventRandomSource = Math.random,
): EventResolution | null => {
  if (eventId !== RARE_ROULETTE_EVENT_ID) return null

  if (action.choiceId === 'leave-rare-roulette') {
    const remaining =
      state.event.minigame?.kind === 'rare-roulette'
        ? state.event.minigame.maxAttempts -
          state.event.minigame.attemptsUsed
        : MAX_SPINS

    return {
      eventId: 77,
      title: '777 룰렛',
      message:
        remaining === MAX_SPINS
          ? '룰렛머신을 돌리지 않고 숲을 떠났습니다.'
          : `남은 기회 ${remaining}회를 포기하고 룰렛머신을 떠났습니다.`,
    }
  }

  if (action.choiceId !== 'spin-rare-roulette') {
    throw new Error('Invalid rare roulette action.')
  }

  return spinRareRoulette(state, random)
}
