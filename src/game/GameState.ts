export type GameStatus =
  | 'ready'
  | 'rolling'
  | 'result'
  | 'moving'
  | 'event'
  | 'choice'
  | 'minigame'
  | 'event-result'
  | 'game-over'
  | 'victory'

export type DiceType = 'normal' | 'dark' | 'special-50'

export type EventId = number | 'blessing' | 'fame' | 'hidden-zero'

export type MinigameKind = 'number-guess' | 'worship' | 'memory'
export type MinigamePhase = 'input' | 'countdown' | 'reveal'
export type TimedChallengeStatus = 'idle' | 'scheduled' | 'active' | 'resolved'

export interface ProgressState {
  stage: number
  isHell: boolean
  gameStatus: GameStatus
}

export interface EconomyState {
  coin: number
  coinGainBonus: number
  coinLossBonus: number
  coinRounding: boolean
  minimumGainBonus: number
}

export interface DiceState {
  type: DiceType
  faces: readonly number[]
  modifier: number
  forcedMove: number | null
  specialDiceAvailable: boolean
  diceBank: boolean
}

export interface BlessingState {
  available: string[]
  owned: string[]
  curses: string[]
  compoundActive: boolean
  starBlessingActive: boolean
  fameEventsRemaining: number
  nextBlessingThreshold: number
}

export interface InventoryState {
  availableItems: string[]
  ownedAccessories: string[]
}

export interface MinigameState {
  kind: MinigameKind
  phase: MinigamePhase
  targetNumber: number | null
  attemptsUsed: number
  maxAttempts: number
  expectedText: string | null
  displayText: string | null
  sequence: string[]
  feedback: string | null
}

export interface TimedChallengeState {
  status: TimedChallengeStatus
  answer: number | null
  triggerAt: number | null
  expiresAt: number | null
  resultText: string | null
}

export interface EventState {
  schedule: number[]
  currentEventId: EventId | null
  pendingChoiceId: string | null
  resultText: string | null
  minigame: MinigameState | null
  timedChallenge: TimedChallengeState
}

export interface HiddenState {
  demonInterest: number
}

export interface GameState {
  progress: ProgressState
  economy: EconomyState
  dice: DiceState
  blessings: BlessingState
  inventory: InventoryState
  event: EventState
  hidden: HiddenState
}

export const INITIAL_GAME_STATE: GameState = {
  progress: {
    stage: 0,
    isHell: false,
    gameStatus: 'ready',
  },
  economy: {
    coin: 5,
    coinGainBonus: 0,
    coinLossBonus: 0,
    coinRounding: false,
    minimumGainBonus: 0,
  },
  dice: {
    type: 'normal',
    faces: [1, 2, 3, 4, 5, 6],
    modifier: 0,
    forcedMove: null,
    specialDiceAvailable: false,
    diceBank: false,
  },
  blessings: {
    available: [],
    owned: [],
    curses: [],
    compoundActive: false,
    starBlessingActive: false,
    fameEventsRemaining: 0,
    nextBlessingThreshold: 100,
  },
  inventory: {
    availableItems: [],
    ownedAccessories: [],
  },
  event: {
    schedule: [],
    currentEventId: null,
    pendingChoiceId: null,
    resultText: null,
    minigame: null,
    timedChallenge: {
      status: 'idle',
      answer: null,
      triggerAt: null,
      expiresAt: null,
      resultText: null,
    },
  },
  hidden: {
    demonInterest: 0,
  },
}
