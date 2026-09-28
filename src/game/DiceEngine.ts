import type { DiceType, GameState } from './GameState'

export interface DiceRollResult {
  source: DiceType | 'forced'
  rawRoll: number
  modifierApplied: number
  accessoryBonus: number
  finalMove: number
}

export type RandomSource = () => number

const normalizeRandom = (random: RandomSource): number =>
  Math.min(0.999999999999, Math.max(0, random()))

const pickFace = (faces: readonly number[], random: RandomSource): number => {
  if (faces.length === 0) throw new Error('Dice has no available faces.')
  return faces[Math.floor(normalizeRandom(random) * faces.length)]
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
      accessoryBonus: 0,
      finalMove: state.dice.forcedMove,
    }
  }

  const rawRoll = pickFace(state.dice.faces, random)
  const modifierApplied = Math.floor(state.dice.modifier)
  const accessoryBonus =
    state.dice.type === 'normal' &&
    state.inventory.ownedAccessories.includes('천사의 깃털') &&
    normalizeRandom(random) < 0.5
      ? 1
      : 0

  return {
    source: state.dice.type,
    rawRoll,
    modifierApplied,
    accessoryBonus,
    finalMove: rawRoll + modifierApplied + accessoryBonus,
  }
}
