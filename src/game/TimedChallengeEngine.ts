import type { GameState } from './GameState'
import { gainCoin, loseCoin } from './EconomyEngine'

export const TIMED_CHALLENGE_DELAY_MS = 60_000
export const TIMED_CHALLENGE_RESPONSE_MS = 1_500

const resetChallenge = (state: GameState): void => {
  state.event.timedChallenge.answer = null
  state.event.timedChallenge.triggerAt = null
  state.event.timedChallenge.expiresAt = null
}

export const scheduleTimedChallenge = (
  state: GameState,
  answer: number,
  now: number = Date.now(),
): boolean => {
  const challenge = state.event.timedChallenge

  if (challenge.status !== 'idle') return false

  if (!Number.isInteger(answer) || answer < 0 || answer > 9) {
    throw new Error('Timed challenge answer must be an integer from 0 to 9.')
  }

  challenge.status = 'scheduled'
  challenge.answer = answer
  challenge.triggerAt = now + TIMED_CHALLENGE_DELAY_MS
  challenge.expiresAt = null
  challenge.resultText = null

  return true
}

export const isTimedChallengeDue = (
  state: Readonly<GameState>,
  now: number = Date.now(),
): boolean =>
  state.event.timedChallenge.status === 'scheduled' &&
  state.event.timedChallenge.triggerAt !== null &&
  now >= state.event.timedChallenge.triggerAt

export const activateTimedChallenge = (
  state: GameState,
  now: number = Date.now(),
): void => {
  const challenge = state.event.timedChallenge

  if (challenge.status !== 'scheduled') return

  challenge.status = 'active'
  challenge.expiresAt = now + TIMED_CHALLENGE_RESPONSE_MS
  challenge.resultText = null
}

export const expireTimedChallenge = (state: GameState): string => {
  const challenge = state.event.timedChallenge

  if (challenge.status !== 'active') {
    return challenge.resultText ?? ''
  }

  const change = loseCoin(state, 2)

  challenge.status = 'resolved'
  challenge.expiresAt = null
  if (state.economy.coin <= 0 && state.progress.gameStatus === 'ready') {
    state.progress.gameStatus = 'game-over'
  }
  challenge.resultText =
    `시간 초과. 코인 ${Math.abs(change.appliedAmount)}개를 잃었습니다. ` +
    `COIN ${change.coinBefore} → ${change.coinAfter}`

  return challenge.resultText
}

export const resolveTimedChallenge = (
  state: GameState,
  input: string,
  now: number = Date.now(),
): string => {
  const challenge = state.event.timedChallenge

  if (challenge.status !== 'active' || challenge.answer === null) {
    throw new Error('Timed challenge is not active.')
  }

  if (challenge.expiresAt !== null && now >= challenge.expiresAt) {
    return expireTimedChallenge(state)
  }

  const correct = input === String(challenge.answer)
  const change = correct ? gainCoin(state, 2) : loseCoin(state, 2)

  challenge.status = 'resolved'
  challenge.expiresAt = null
  if (state.economy.coin <= 0 && state.progress.gameStatus === 'ready') {
    state.progress.gameStatus = 'game-over'
  }
  challenge.resultText = correct
    ? `성공. 코인 ${change.appliedAmount}개를 얻었습니다. COIN ${change.coinBefore} → ${change.coinAfter}`
    : `잘못된 숫자입니다. 코인 ${Math.abs(change.appliedAmount)}개를 잃었습니다. COIN ${change.coinBefore} → ${change.coinAfter}`

  return challenge.resultText
}

export const dismissTimedChallenge = (state: GameState): void => {
  const challenge = state.event.timedChallenge

  challenge.status = 'idle'
  challenge.resultText = null
  resetChallenge(state)
}
