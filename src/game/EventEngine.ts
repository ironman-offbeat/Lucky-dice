import type { EventId, GameState } from './GameState'
import { settleEconomy, type EconomySettlementResult } from './EconomyEngine'
import { getEventDefinition } from '../events/registry'
import { presentEventDefinition } from '../events/presentation'
import { prepareRegisteredEvent, resolveRegisteredEvent } from '../events/resolvers'
import {
  createEventSchedule,
  scheduledEventIdAt,
  type EventRandomSource,
} from '../events/schedule'
import type {
  EventAction,
  EventDefinition,
  EventNumericInputDefinition,
  EventResolution,
} from '../events/types'

const assertStatus = (
  state: Readonly<GameState>,
  expected: GameState['progress']['gameStatus'],
): void => {
  if (state.progress.gameStatus !== expected) {
    throw new Error(
      `Invalid event status: expected ${expected}, got ${state.progress.gameStatus}.`,
    )
  }
}

const randomChoice = (
  pool: readonly number[],
  random: EventRandomSource,
): number => {
  const normalized = Math.min(0.999999999999, Math.max(0, random()))
  return pool[Math.floor(normalized * pool.length)]
}

export const initializeEventSchedule = (
  state: GameState,
  random: EventRandomSource = Math.random,
): readonly number[] => {
  if (state.event.schedule.length === 0) {
    state.event.schedule = createEventSchedule(random)
  }

  return state.event.schedule
}

export const resolveEventIdForCurrentStage = (
  state: GameState,
  random: EventRandomSource = Math.random,
): EventId => {
  initializeEventSchedule(state, random)

  if (state.blessings.fameEventsRemaining > 0) return 'fame'
  if (state.progress.stage >= state.blessings.nextBlessingThreshold) {
    return 'blessing'
  }
  if (state.progress.stage <= 0) return 'hidden-zero'

  const scheduledId = scheduledEventIdAt(
    state.event.schedule,
    state.progress.stage,
  )

  if (scheduledId === 49 && !state.blessings.starBlessingActive) {
    return randomChoice([50, 51, 52, 53], random)
  }

  return scheduledId
}

export const prepareCurrentEvent = (
  state: GameState,
  random: EventRandomSource = Math.random,
): EventDefinition => {
  assertStatus(state, 'event')

  const eventId = resolveEventIdForCurrentStage(state, random)
  state.event.currentEventId = eventId
  state.event.pendingChoiceId = null
  state.event.resultText = null
  state.event.minigame = null
  prepareRegisteredEvent(state, eventId, random)
  state.progress.gameStatus = 'choice'

  return presentEventDefinition(
    state,
    getEventDefinition(eventId),
  )
}

export const getCurrentEventDefinition = (
  state: Readonly<GameState>,
): EventDefinition | null => {
  if (state.event.currentEventId === null) return null

  return presentEventDefinition(
    state,
    getEventDefinition(state.event.currentEventId),
  )
}

const resolveNumericInputMax = (
  state: Readonly<GameState>,
  input: Readonly<EventNumericInputDefinition>,
): number =>
  input.maxSource === 'coin-floor'
    ? Math.floor(state.economy.coin)
    : input.max ?? Number.POSITIVE_INFINITY

const settleCompletedEvent = (
  state: GameState,
): EconomySettlementResult => {
  const completedEventId = state.event.currentEventId

  if (completedEventId === 'blessing') {
    state.blessings.nextBlessingThreshold += 100
  } else if (completedEventId === 'fame') {
    state.blessings.fameEventsRemaining = Math.max(
      0,
      state.blessings.fameEventsRemaining - 1,
    )
  }

  state.event.pendingChoiceId = null
  state.event.minigame = null
  state.event.blessingOffers = []

  const settlement = settleEconomy(state)

  if (!settlement.gameOver) {
    state.progress.gameStatus = 'ready'
  }

  return settlement
}

const applyResolutionState = (
  state: GameState,
  resolution: EventResolution,
): EventResolution => {
  state.event.resultText = resolution.message

  if (resolution.complete === false) {
    state.progress.gameStatus = 'minigame'
  } else {
    settleCompletedEvent(state)
  }

  return resolution
}

export const resolveCurrentEventAction = (
  state: GameState,
  action: EventAction,
  random: EventRandomSource = Math.random,
): EventResolution => {
  assertStatus(state, 'choice')

  if (state.event.currentEventId === null) {
    throw new Error('No current event is prepared.')
  }

  const currentEvent = getCurrentEventDefinition(state)
  if (!currentEvent) throw new Error('No current event definition.')
  const numericInput = currentEvent.numericInput
  const numericInputMax = numericInput
    ? resolveNumericInputMax(state, numericInput)
    : null
  const isNumericAction =
    numericInput !== undefined &&
    action.choiceId === numericInput.id
  const isFallbackAction =
    numericInput?.fallbackChoice?.id === action.choiceId &&
    numericInputMax !== null &&
    numericInputMax < numericInput.min
  const isListedChoice = currentEvent.choices.some(
    (entry) => entry.id === action.choiceId,
  )

  if (isNumericAction) {
    const value = action.numericValue
    const step = numericInput.step ?? 1
    const stepOffset =
      value === undefined
        ? Number.POSITIVE_INFINITY
        : (value - numericInput.min) / step

    if (
      value === undefined ||
      !Number.isFinite(value) ||
      value < numericInput.min ||
      value > (numericInputMax ?? Number.POSITIVE_INFINITY) ||
      Math.abs(stepOffset - Math.round(stepOffset)) > 1e-9
    ) {
      throw new Error(
        `Numeric value is not valid for event ${String(currentEvent.id)}.`,
      )
    }
  } else if (!isListedChoice && !isFallbackAction) {
    throw new Error(
      `Choice ${action.choiceId} is not valid for event ${String(currentEvent.id)}.`,
    )
  }

  state.event.pendingChoiceId = action.choiceId

  const implementedResolution = resolveRegisteredEvent(
    state,
    currentEvent.id,
    action,
    random,
  )

  if (currentEvent.implemented && !implementedResolution) {
    throw new Error(
      `Implemented event ${String(currentEvent.id)} has no registered resolver.`,
    )
  }

  return applyResolutionState(
    state,
    implementedResolution ?? {
      eventId: currentEvent.id,
      title: currentEvent.name,
      message:
        `${currentEvent.name}의 실행 경로가 정상적으로 연결되었습니다. ` +
        '실제 효과는 이후 이벤트 이식 단계에서 적용됩니다.',
    },
  )
}

export const resolveCurrentMinigameAction = (
  state: GameState,
  action: EventAction,
  random: EventRandomSource = Math.random,
): EventResolution => {
  assertStatus(state, 'minigame')

  if (
    state.event.currentEventId === null ||
    state.event.minigame === null
  ) {
    throw new Error('No active minigame.')
  }

  const currentEvent = getCurrentEventDefinition(state)
  if (!currentEvent) throw new Error('No current minigame definition.')

  const resolution = resolveRegisteredEvent(
    state,
    currentEvent.id,
    action,
    random,
  )

  if (!resolution) {
    throw new Error(
      `Minigame event ${String(currentEvent.id)} has no registered resolver.`,
    )
  }

  return applyResolutionState(state, resolution)
}

export const completeCurrentEvent = (
  state: GameState,
): EconomySettlementResult => {
  assertStatus(state, 'event-result')
  return settleCompletedEvent(state)
}
