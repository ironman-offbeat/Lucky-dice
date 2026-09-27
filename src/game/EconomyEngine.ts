import type { GameState } from './GameState'

const COMPOUND_STEP = 0.2
const PRECISION = 1_000_000_000

export interface CoinChangeResult {
  coinBefore: number
  coinAfter: number
  requestedAmount: number
  appliedAmount: number
  gainBonusApplied: number
  lossBonusApplied: number
  compoundIncrease: number
}

export interface GainCoinOptions {
  applyGainBonus?: boolean
  triggerCompound?: boolean
}

export interface LoseCoinOptions {
  applyLossBonus?: boolean
}

export interface EconomySettlementResult {
  coinBefore: number
  coinAfter: number
  gainBonusBefore: number
  gainBonusAfter: number
  lossBonusBefore: number
  lossBonusAfter: number
  rounded: boolean
  gameOver: boolean
}

const normalize = (value: number): number => {
  const normalized = Math.round(value * PRECISION) / PRECISION
  return Object.is(normalized, -0) ? 0 : normalized
}

const assertNonNegative = (value: number, label: string): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite non-negative number.`)
  }
}

const applyCoinDelta = (state: GameState, delta: number): { before: number; after: number } => {
  if (!Number.isFinite(delta)) {
    throw new Error('Coin delta must be finite.')
  }

  const before = state.economy.coin
  state.economy.coin = normalize(before + delta)
  return { before, after: state.economy.coin }
}

const applyCompoundAfterPositiveGain = (
  state: GameState,
  positiveGain: number,
  enabled: boolean,
): number => {
  if (!enabled || positiveGain <= 0 || !state.blessings.compoundActive) return 0

  state.economy.coinGainBonus = normalize(state.economy.coinGainBonus + COMPOUND_STEP)
  return COMPOUND_STEP
}

export const gainCoin = (
  state: GameState,
  baseAmount: number,
  options: GainCoinOptions = {},
): CoinChangeResult => {
  assertNonNegative(baseAmount, 'Base gain')

  const applyGainBonus = options.applyGainBonus ?? true
  const triggerCompound = options.triggerCompound ?? true
  const gainBonusApplied = applyGainBonus ? state.economy.coinGainBonus : 0
  const appliedAmount = normalize(baseAmount + gainBonusApplied)
  const { before, after } = applyCoinDelta(state, appliedAmount)
  const compoundIncrease = applyCompoundAfterPositiveGain(state, appliedAmount, triggerCompound)

  return {
    coinBefore: before,
    coinAfter: after,
    requestedAmount: baseAmount,
    appliedAmount,
    gainBonusApplied,
    lossBonusApplied: 0,
    compoundIncrease,
  }
}

export const grantCoin = (
  state: GameState,
  amount: number,
  options: Pick<GainCoinOptions, 'triggerCompound'> = {},
): CoinChangeResult => {
  assertNonNegative(amount, 'Grant amount')

  const triggerCompound = options.triggerCompound ?? false
  const { before, after } = applyCoinDelta(state, amount)
  const compoundIncrease = applyCompoundAfterPositiveGain(state, amount, triggerCompound)

  return {
    coinBefore: before,
    coinAfter: after,
    requestedAmount: amount,
    appliedAmount: amount,
    gainBonusApplied: 0,
    lossBonusApplied: 0,
    compoundIncrease,
  }
}

export const loseCoin = (
  state: GameState,
  baseAmount: number,
  options: LoseCoinOptions = {},
): CoinChangeResult => {
  assertNonNegative(baseAmount, 'Base loss')

  const applyLossBonus = options.applyLossBonus ?? true
  const lossBonusApplied = applyLossBonus ? state.economy.coinLossBonus : 0
  const appliedLoss = normalize(baseAmount + lossBonusApplied)
  const { before, after } = applyCoinDelta(state, -appliedLoss)

  return {
    coinBefore: before,
    coinAfter: after,
    requestedAmount: baseAmount,
    appliedAmount: -appliedLoss,
    gainBonusApplied: 0,
    lossBonusApplied,
    compoundIncrease: 0,
  }
}

export const spendCoin = (state: GameState, amount: number): CoinChangeResult =>
  loseCoin(state, amount, { applyLossBonus: false })

export const canAfford = (state: Readonly<GameState>, amount: number): boolean => {
  assertNonNegative(amount, 'Cost')
  return state.economy.coin >= amount
}

export const setCoin = (state: GameState, value: number): CoinChangeResult => {
  if (!Number.isFinite(value)) throw new Error('Coin value must be finite.')

  const before = state.economy.coin
  state.economy.coin = normalize(value)

  return {
    coinBefore: before,
    coinAfter: state.economy.coin,
    requestedAmount: value,
    appliedAmount: normalize(state.economy.coin - before),
    gainBonusApplied: 0,
    lossBonusApplied: 0,
    compoundIncrease: 0,
  }
}

export const multiplyCoin = (state: GameState, multiplier: number): CoinChangeResult => {
  if (!Number.isFinite(multiplier) || multiplier < 0) {
    throw new Error('Coin multiplier must be a finite non-negative number.')
  }

  return setCoin(state, state.economy.coin * multiplier)
}

export const changeGainBonus = (state: GameState, delta: number): number => {
  if (!Number.isFinite(delta)) throw new Error('Gain bonus delta must be finite.')
  state.economy.coinGainBonus = normalize(state.economy.coinGainBonus + delta)
  return state.economy.coinGainBonus
}

export const setGainBonus = (state: GameState, value: number): number => {
  if (!Number.isFinite(value)) throw new Error('Gain bonus must be finite.')
  state.economy.coinGainBonus = normalize(value)
  return state.economy.coinGainBonus
}

export const setMinimumGainBonus = (state: GameState, value: number): number => {
  if (!Number.isFinite(value)) throw new Error('Minimum gain bonus must be finite.')
  state.economy.minimumGainBonus = normalize(value)
  return state.economy.minimumGainBonus
}

export const changeLossBonus = (state: GameState, delta: number): number => {
  if (!Number.isFinite(delta)) throw new Error('Loss bonus delta must be finite.')
  state.economy.coinLossBonus = normalize(state.economy.coinLossBonus + delta)
  return state.economy.coinLossBonus
}

export const setLossBonus = (state: GameState, value: number): number => {
  if (!Number.isFinite(value)) throw new Error('Loss bonus must be finite.')
  state.economy.coinLossBonus = normalize(value)
  return state.economy.coinLossBonus
}

export const setCoinRounding = (state: GameState, enabled: boolean): boolean => {
  state.economy.coinRounding = enabled
  return state.economy.coinRounding
}

export const settleEconomy = (state: GameState): EconomySettlementResult => {
  const coinBefore = state.economy.coin
  const gainBonusBefore = state.economy.coinGainBonus
  const lossBonusBefore = state.economy.coinLossBonus
  let rounded = false

  if (state.economy.coinRounding) {
    const roundedCoin = Math.ceil(state.economy.coin)
    rounded = roundedCoin !== state.economy.coin
    state.economy.coin = roundedCoin
  }

  state.economy.coinLossBonus = Math.max(0, normalize(state.economy.coinLossBonus))
  state.economy.coinGainBonus = Math.max(
    state.economy.minimumGainBonus,
    normalize(state.economy.coinGainBonus),
  )

  const gameOver = state.economy.coin <= 0 && state.progress.gameStatus !== 'victory'
  if (gameOver) {
    state.progress.gameStatus = 'game-over'
  }

  return {
    coinBefore,
    coinAfter: state.economy.coin,
    gainBonusBefore,
    gainBonusAfter: state.economy.coinGainBonus,
    lossBonusBefore,
    lossBonusAfter: state.economy.coinLossBonus,
    rounded,
    gameOver,
  }
}
