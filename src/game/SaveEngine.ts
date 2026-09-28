import { BLESSING_IDS, type BlessingId } from '../data/blessings'
import { ITEM_IDS, type ItemId } from '../data/items'
import {
  INITIAL_GAME_STATE,
  type GameState,
  type GameStatus,
  type MinigameKind,
  type MinigamePhase,
  type TimedChallengeStatus,
} from './GameState'

export const SAVE_FORMAT_VERSION = 1
export const SAVE_STORAGE_KEY = 'lucky-dice.save.v1'

const PERSISTABLE_STATUSES: readonly GameStatus[] = [
  'ready',
  'choice',
  'minigame',
  'event-result',
  'game-over',
  'victory',
]

const GAME_STATUSES: readonly GameStatus[] = [
  'ready',
  'rolling',
  'result',
  'moving',
  'event',
  'choice',
  'minigame',
  'event-result',
  'game-over',
  'victory',
]

const MINIGAME_KINDS: readonly MinigameKind[] = [
  'number-guess',
  'worship',
  'memory',
  'lottery',
  'black-market',
  'rare-roulette',
]

const MINIGAME_PHASES: readonly MinigamePhase[] = [
  'input',
  'countdown',
  'reveal',
]

const TIMED_CHALLENGE_STATUSES: readonly TimedChallengeStatus[] = [
  'idle',
  'scheduled',
  'active',
  'resolved',
]

interface SaveEnvelope {
  version: number
  savedAt: number
  state: GameState
}

export type SaveFailureReason =
  | 'storage-unavailable'
  | 'unstable-state'
  | 'missing'
  | 'invalid-json'
  | 'unsupported-version'
  | 'invalid-state'

export type SaveWriteResult =
  | { ok: true; savedAt: number }
  | { ok: false; reason: SaveFailureReason }

export type SaveLoadResult =
  | { ok: true; savedAt: number; state: GameState }
  | { ok: false; reason: SaveFailureReason }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isNullableFiniteNumber = (
  value: unknown,
): value is number | null =>
  value === null || isFiniteNumber(value)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((entry) => typeof entry === 'string')

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.every((entry) => isFiniteNumber(entry))

const isGameStatus = (value: unknown): value is GameStatus =>
  typeof value === 'string' &&
  GAME_STATUSES.includes(value as GameStatus)

const isMinigameKind = (value: unknown): value is MinigameKind =>
  typeof value === 'string' &&
  MINIGAME_KINDS.includes(value as MinigameKind)

const isMinigamePhase = (value: unknown): value is MinigamePhase =>
  typeof value === 'string' &&
  MINIGAME_PHASES.includes(value as MinigamePhase)

const isTimedChallengeStatus = (
  value: unknown,
): value is TimedChallengeStatus =>
  typeof value === 'string' &&
  TIMED_CHALLENGE_STATUSES.includes(
    value as TimedChallengeStatus,
  )

const isValidEventId = (value: unknown): boolean =>
  value === null ||
  isFiniteNumber(value) ||
  value === 'blessing' ||
  value === 'fame' ||
  value === 'hidden-zero'

const hasUniqueNumbersInRange = (
  value: unknown,
  min: number,
  max: number,
  expectedLength?: number,
): value is number[] =>
  isNumberArray(value) &&
  (expectedLength === undefined ||
    value.length === expectedLength) &&
  new Set(value).size === value.length &&
  value.every(
    (entry) =>
      Number.isInteger(entry) &&
      entry >= min &&
      entry <= max,
  )

const isBlessingId = (value: string): value is BlessingId =>
  BLESSING_IDS.includes(value as BlessingId)

const isItemId = (value: string): value is ItemId =>
  ITEM_IDS.includes(value as ItemId)

const isValidRouletteDigits = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every(
      (entry) =>
        Number.isInteger(entry) &&
        entry >= 1 &&
        entry <= 9,
    )
  )

const isValidMinigame = (value: unknown): boolean => {
  if (value === null) return true
  if (!isRecord(value)) return false

  if (
    !isMinigameKind(value.kind) ||
    !isMinigamePhase(value.phase) ||
    !isFiniteNumber(value.attemptsUsed) ||
    !Number.isInteger(value.attemptsUsed) ||
    value.attemptsUsed < 0 ||
    !isFiniteNumber(value.maxAttempts) ||
    !Number.isInteger(value.maxAttempts) ||
    value.maxAttempts < 1 ||
    (value.feedback !== null &&
      typeof value.feedback !== 'string') ||
    !isStringArray(value.sequence)
  ) {
    return false
  }

  switch (value.kind) {
    case 'number-guess':
      return (
        value.phase === 'input' &&
        Number.isInteger(value.targetNumber) &&
        Number(value.targetNumber) >= 1 &&
        Number(value.targetNumber) <= 99 &&
        value.maxAttempts === 6 &&
        value.attemptsUsed <= 6 &&
        value.expectedText === null &&
        value.displayText === null
      )

    case 'worship':
      return (
        value.phase === 'input' &&
        value.targetNumber === null &&
        value.maxAttempts === 1 &&
        value.attemptsUsed === 0 &&
        typeof value.expectedText === 'string' &&
        /^[A-Za-z]{25}$/.test(value.expectedText) &&
        typeof value.displayText === 'string'
      )

    case 'memory':
      return (
        value.targetNumber === null &&
        value.maxAttempts === 1 &&
        value.attemptsUsed === 0 &&
        typeof value.expectedText === 'string' &&
        /^[1-3]{12}$/.test(value.expectedText) &&
        value.sequence.length === 12 &&
        value.sequence.every(
          (entry) => /^[1-3]$/.test(entry),
        ) &&
        value.sequence.join('') === value.expectedText &&
        (value.displayText === null ||
          typeof value.displayText === 'string')
      )

    case 'lottery': {
      if (
        value.phase !== 'input' ||
        value.targetNumber !== null ||
        value.maxAttempts !== 1 ||
        value.attemptsUsed !== 0 ||
        !hasUniqueNumbersInRange(
          value.selectedNumbers,
          1,
          45,
        ) ||
        value.selectedNumbers.length > 6 ||
        !hasUniqueNumbersInRange(
          value.drawNumbers,
          1,
          45,
          6,
        ) ||
        !Number.isInteger(value.bonusNumber) ||
        Number(value.bonusNumber) < 1 ||
        Number(value.bonusNumber) > 45
      ) {
        return false
      }

      return !value.drawNumbers.includes(
        Number(value.bonusNumber),
      )
    }

    case 'black-market':
      return (
        value.phase === 'input' &&
        value.targetNumber === null &&
        value.maxAttempts === 1 &&
        value.attemptsUsed === 0 &&
        Array.isArray(value.marketOffers) &&
        value.marketOffers.length <= 4 &&
        new Set(value.marketOffers).size ===
          value.marketOffers.length &&
        value.marketOffers.every(
          (entry) =>
            typeof entry === 'string' &&
            isItemId(entry),
        ) &&
        isValidRouletteDigits(value.rouletteDigits)
      )

    case 'rare-roulette':
      return (
        value.phase === 'input' &&
        value.targetNumber === null &&
        value.maxAttempts === 3 &&
        value.attemptsUsed <= 3 &&
        isValidRouletteDigits(value.rouletteDigits)
      )
  }
}

const isTimedAnswer = (value: unknown): value is number =>
  Number.isInteger(value) &&
  Number(value) >= 0 &&
  Number(value) <= 9

const isValidTimedChallenge = (value: unknown): boolean => {
  if (!isRecord(value)) return false
  if (!isTimedChallengeStatus(value.status)) return false

  switch (value.status) {
    case 'idle':
      return (
        value.answer === null &&
        value.triggerAt === null &&
        value.expiresAt === null &&
        value.resultText === null
      )

    case 'scheduled':
      return (
        isTimedAnswer(value.answer) &&
        isFiniteNumber(value.triggerAt) &&
        value.expiresAt === null &&
        value.resultText === null
      )

    case 'active':
      return (
        isTimedAnswer(value.answer) &&
        isFiniteNumber(value.triggerAt) &&
        isFiniteNumber(value.expiresAt) &&
        value.expiresAt >= value.triggerAt &&
        value.resultText === null
      )

    case 'resolved':
      return (
        isTimedAnswer(value.answer) &&
        isFiniteNumber(value.triggerAt) &&
        value.expiresAt === null &&
        typeof value.resultText === 'string'
      )
  }
}

const isValidGameState = (value: unknown): value is GameState => {
  if (!isRecord(value)) return false

  const {
    progress,
    economy,
    dice,
    blessings,
    inventory,
    event,
    hidden,
  } = value

  if (
    !isRecord(progress) ||
    !isFiniteNumber(progress.stage) ||
    !Number.isInteger(progress.stage) ||
    typeof progress.isHell !== 'boolean' ||
    !isGameStatus(progress.gameStatus)
  ) {
    return false
  }

  if (
    !isRecord(economy) ||
    !isFiniteNumber(economy.coin) ||
    !isFiniteNumber(economy.coinGainBonus) ||
    !isFiniteNumber(economy.coinLossBonus) ||
    typeof economy.coinRounding !== 'boolean' ||
    !isFiniteNumber(economy.minimumGainBonus)
  ) {
    return false
  }

  if (
    !isRecord(dice) ||
    !['normal', 'dark', 'special-50'].includes(
      String(dice.type),
    ) ||
    !isNumberArray(dice.faces) ||
    dice.faces.length === 0 ||
    !isFiniteNumber(dice.modifier) ||
    !isNullableFiniteNumber(dice.forcedMove) ||
    typeof dice.specialDiceAvailable !== 'boolean' ||
    typeof dice.diceBank !== 'boolean'
  ) {
    return false
  }

  if (
    !isRecord(blessings) ||
    !isStringArray(blessings.available) ||
    !blessings.available.every(isBlessingId) ||
    new Set(blessings.available).size !==
      blessings.available.length ||
    !isStringArray(blessings.owned) ||
    !blessings.owned.every(isBlessingId) ||
    new Set(blessings.owned).size !==
      blessings.owned.length ||
    blessings.available.some((entry) =>
      blessings.owned.includes(entry)
    ) ||
    !isStringArray(blessings.curses) ||
    typeof blessings.compoundActive !== 'boolean' ||
    typeof blessings.starBlessingActive !== 'boolean' ||
    !isFiniteNumber(blessings.fameEventsRemaining) ||
    !isFiniteNumber(blessings.nextBlessingThreshold)
  ) {
    return false
  }

  if (
    !isRecord(inventory) ||
    !isStringArray(inventory.availableItems) ||
    !isStringArray(inventory.ownedAccessories) ||
    typeof inventory.memorySaveRequested !== 'boolean'
  ) {
    return false
  }

  if (
    !isRecord(event) ||
    !isNumberArray(event.schedule) ||
    event.schedule.length < 462 ||
    !event.schedule.every(Number.isInteger) ||
    !isValidEventId(event.currentEventId) ||
    (event.pendingChoiceId !== null &&
      typeof event.pendingChoiceId !== 'string') ||
    (event.resultText !== null &&
      typeof event.resultText !== 'string') ||
    !isValidMinigame(event.minigame) ||
    !isStringArray(event.blessingOffers) ||
    !isValidTimedChallenge(event.timedChallenge)
  ) {
    return false
  }

  if (
    !isRecord(hidden) ||
    !isFiniteNumber(hidden.demonInterest)
  ) {
    return false
  }

  if (!PERSISTABLE_STATUSES.includes(progress.gameStatus)) {
    return false
  }

  if (
    ['choice', 'minigame', 'event-result'].includes(
      progress.gameStatus,
    ) &&
    event.currentEventId === null
  ) {
    return false
  }

  if (
    progress.gameStatus === 'minigame' &&
    event.minigame === null
  ) {
    return false
  }

  if (
    progress.gameStatus === 'minigame' &&
    event.minigame !== null
  ) {
    const expectedEventId = {
      'number-guess': 7,
      worship: 9,
      memory: 10,
      lottery: 52,
      'black-market': 54,
      'rare-roulette': 77,
    }[event.minigame.kind]

    if (event.currentEventId !== expectedEventId) {
      return false
    }
  }

  return true
}

const normalizeLoadedState = (
  savedState: GameState,
): GameState => {
  const state = structuredClone(savedState)

  state.progress.isHell =
    state.progress.stage > 300 &&
    state.progress.stage < 400

  state.inventory.memorySaveRequested = false

  if (
    state.progress.gameStatus === 'minigame' &&
    state.event.minigame?.kind === 'memory' &&
    state.event.minigame.phase === 'reveal'
  ) {
    state.event.minigame.phase = 'countdown'
    state.event.minigame.displayText = '3'
    state.event.minigame.feedback =
      '저장된 기억 이벤트를 처음부터 다시 보여줍니다.'
  }

  return state
}

const storageOrNull = (
  storage?: Storage,
): Storage | null => {
  if (storage) return storage

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const createNewGameState = (): GameState =>
  structuredClone(INITIAL_GAME_STATE)

export const canPersistGameState = (
  state: Readonly<GameState>,
): boolean =>
  PERSISTABLE_STATUSES.includes(state.progress.gameStatus)

export const saveGame = (
  state: Readonly<GameState>,
  storage?: Storage,
  now: number = Date.now(),
): SaveWriteResult => {
  if (!canPersistGameState(state)) {
    return { ok: false, reason: 'unstable-state' }
  }

  const target = storageOrNull(storage)
  if (!target) {
    return { ok: false, reason: 'storage-unavailable' }
  }

  const snapshot = structuredClone(state)
  snapshot.inventory.memorySaveRequested = false

  const envelope: SaveEnvelope = {
    version: SAVE_FORMAT_VERSION,
    savedAt: now,
    state: snapshot,
  }

  try {
    target.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify(envelope),
    )
  } catch {
    return { ok: false, reason: 'storage-unavailable' }
  }

  return { ok: true, savedAt: now }
}

export const loadGame = (
  storage?: Storage,
): SaveLoadResult => {
  const target = storageOrNull(storage)
  if (!target) {
    return { ok: false, reason: 'storage-unavailable' }
  }

  let raw: string | null

  try {
    raw = target.getItem(SAVE_STORAGE_KEY)
  } catch {
    return { ok: false, reason: 'storage-unavailable' }
  }

  if (raw === null) {
    return { ok: false, reason: 'missing' }
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, reason: 'invalid-json' }
  }

  if (!isRecord(parsed)) {
    return { ok: false, reason: 'invalid-state' }
  }

  if (parsed.version !== SAVE_FORMAT_VERSION) {
    return {
      ok: false,
      reason: 'unsupported-version',
    }
  }

  if (
    !isFiniteNumber(parsed.savedAt) ||
    !isValidGameState(parsed.state)
  ) {
    return { ok: false, reason: 'invalid-state' }
  }

  return {
    ok: true,
    savedAt: parsed.savedAt,
    state: normalizeLoadedState(parsed.state),
  }
}

export const deleteSavedGame = (
  storage?: Storage,
): boolean => {
  const target = storageOrNull(storage)
  if (!target) return false

  try {
    target.removeItem(SAVE_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
