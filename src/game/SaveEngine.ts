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

const isValidMinigame = (value: unknown): boolean => {
  if (value === null) return true
  if (!isRecord(value)) return false

  return (
    isMinigameKind(value.kind) &&
    isMinigamePhase(value.phase) &&
    isNullableFiniteNumber(value.targetNumber) &&
    isFiniteNumber(value.attemptsUsed) &&
    isFiniteNumber(value.maxAttempts) &&
    (value.expectedText === null ||
      typeof value.expectedText === 'string') &&
    (value.displayText === null ||
      typeof value.displayText === 'string') &&
    isStringArray(value.sequence) &&
    (value.feedback === null ||
      typeof value.feedback === 'string') &&
    (value.selectedNumbers === undefined ||
      isNumberArray(value.selectedNumbers)) &&
    (value.drawNumbers === undefined ||
      isNumberArray(value.drawNumbers)) &&
    (value.bonusNumber === undefined ||
      isFiniteNumber(value.bonusNumber)) &&
    (value.marketOffers === undefined ||
      isStringArray(value.marketOffers)) &&
    (value.rouletteDigits === undefined ||
      value.rouletteDigits === null ||
      (Array.isArray(value.rouletteDigits) &&
        value.rouletteDigits.length === 3 &&
        value.rouletteDigits.every(isFiniteNumber)))
  )
}

const isValidTimedChallenge = (value: unknown): boolean => {
  if (!isRecord(value)) return false
  if (!isTimedChallengeStatus(value.status)) return false
  if (!isNullableFiniteNumber(value.answer)) return false
  if (!isNullableFiniteNumber(value.triggerAt)) return false
  if (!isNullableFiniteNumber(value.expiresAt)) return false
  if (
    value.resultText !== null &&
    typeof value.resultText !== 'string'
  ) {
    return false
  }

  if (
    value.status === 'scheduled' &&
    value.triggerAt === null
  ) {
    return false
  }

  if (
    value.status === 'active' &&
    value.expiresAt === null
  ) {
    return false
  }

  return true
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
    !isStringArray(blessings.owned) ||
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
