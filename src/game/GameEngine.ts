import type { GameState } from './GameState'
import type { DiceRollResult, RandomSource } from './DiceEngine'
import { rollDice } from './DiceEngine'
import { grantCoin } from './EconomyEngine'

export interface StageMoveResult extends DiceRollResult {
  stageBefore: number
  stageAfter: number
}

const assertStatus = (state: Readonly<GameState>, expected: GameState['progress']['gameStatus']): void => {
  if (state.progress.gameStatus !== expected) {
    throw new Error(`Invalid game status: expected ${expected}, got ${state.progress.gameStatus}.`)
  }
}

export const beginRoll = (
  state: GameState,
  random: RandomSource = Math.random,
): StageMoveResult => {
  assertStatus(state, 'ready')

  const roll = rollDice(state, random)
  const stageBefore = state.progress.stage

  if (roll.source === 'forced') {
    state.dice.forcedMove = null
  }

  if (state.dice.diceBank) {
    grantCoin(state, 0.5)
  }

  state.progress.gameStatus = 'rolling'

  return {
    ...roll,
    stageBefore,
    stageAfter: stageBefore + roll.finalMove,
  }
}

export const revealRoll = (state: GameState): void => {
  assertStatus(state, 'rolling')
  state.progress.gameStatus = 'result'
}

export const beginMove = (state: GameState): void => {
  assertStatus(state, 'result')
  state.progress.gameStatus = 'moving'
}

export const completeMove = (state: GameState, move: Readonly<StageMoveResult>): void => {
  assertStatus(state, 'moving')

  state.progress.stage = move.stageAfter
  state.progress.isHell = state.progress.stage > 300 && state.progress.stage < 400

  if (state.progress.stage >= 400) {
    state.progress.gameStatus = 'victory'
    return
  }

  state.progress.gameStatus = 'event'
}
