export type GameStatus =
  | 'ready'
  | 'rolling'
  | 'result'
  | 'moving'
  | 'event'
  | 'choice'
  | 'event-result'
  | 'game-over'
  | 'victory'

export type DiceType = 'normal' | 'dark' | 'special-50'

export type EventId = number | 'blessing' | 'fame' | 'hidden-zero'

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
  compoundActive: boolean
  starBlessingActive: boolean
  fameEventsRemaining: number
  nextBlessingThreshold: number
}

export interface InventoryState {
  availableItems: string[]
  ownedAccessories: string[]
}

export interface EventState {
  schedule: number[]
  currentEventId: EventId | null
  pendingChoiceId: string | null
  pendingTimedEvent: boolean
  resultText: string | null
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
    pendingTimedEvent: false,
    resultText: null,
  },
  hidden: {
    demonInterest: 0,
  },
}
