import type { DiceType, GameState } from './GameState'

export interface DiceRollResult {
  source: DiceType | 'forced'
  rawRoll: number
  modifierApplied: number
  finalMove: number
}

export type RandomSource = () => number

const pickFace = (faces: readonly number[], random: RandomSource): number => {
  if (faces.length === 0) {
    throw new Error('Dice has no available faces.')
  }

  const normalized = Math.min(0.999999999999, Math.max(0, random()))
  return faces[Math.floor(normalized * faces.length)]
}

export const rollDice = (
  state: Readonly<GameState>,
  random: RandomSource = Math.random,
): DiceRollResult => {
  if (state.dice.forcedMove !== null) {
    return {
      source: 'forced',
      rawRoll: state.dice.forcedMove,
      modifierApplied: 0,
      finalMove: state.dice.forcedMove,
    }
  }

  const rawRoll = pickFace(state.dice.faces, random)
  const modifierApplied = Math.floor(state.dice.modifier)

  return {
    source: state.dice.type,
    rawRoll,
    modifierApplied,
    finalMove: rawRoll + modifierApplied,
  }
}
