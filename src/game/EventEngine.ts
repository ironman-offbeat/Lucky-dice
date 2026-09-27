import type { EventId, GameState } from './GameState'
import { settleEconomy, type EconomySettlementResult } from './EconomyEngine'
import { getEventDefinition } from '../events/registry'
import {
  createEventSchedule,
  scheduledEventIdAt,
  type EventRandomSource,
} from '../events/schedule'
import type {
  EventDefinition,
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

  // Preserve the original dispatcher priority.
  if (state.blessings.fameEventsRemaining > 0) return 'fame'
  if (state.progress.stage >= state.blessings.nextBlessingThreshold) return 'blessing'
  if (state.progress.stage <= 0) return 'hidden-zero'

  const scheduledId = scheduledEventIdAt(
    state.event.schedule,
    state.progress.stage,
  )

  // Original behavior: a star event without the star blessing becomes
  // one random special event among 50~53.
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
  state.progress.gameStatus = 'choice'

  return getEventDefinition(eventId)
}

export const getCurrentEventDefinition = (
  state: Readonly<GameState>,
): EventDefinition | null => {
  if (state.event.currentEventId === null) return null
  return getEventDefinition(state.event.currentEventId)
}

export const resolveCurrentEventChoice = (
  state: GameState,
  choiceId: string,
): EventResolution => {
  assertStatus(state, 'choice')

  if (state.event.currentEventId === null) {
    throw new Error('No current event is prepared.')
  }

  const currentEvent = getEventDefinition(state.event.currentEventId)
  const choice = currentEvent.choices.find((entry) => entry.id === choiceId)

  if (!choice) {
    throw new Error(
      `Choice ${choiceId} is not valid for event ${String(currentEvent.id)}.`,
    )
  }

  state.event.pendingChoiceId = choice.id
  state.event.resultText = currentEvent.implemented
    ? `${currentEvent.name} 결과가 적용되었습니다.`
    : `${currentEvent.name}의 실행 경로가 정상적으로 연결되었습니다. 실제 효과는 다음 이벤트 이식 단계에서 적용됩니다.`
  state.progress.gameStatus = 'event-result'

  return {
    eventId: currentEvent.id,
    title: currentEvent.name,
    message: state.event.resultText,
  }
}

export const completeCurrentEvent = (
  state: GameState,
): EconomySettlementResult => {
  assertStatus(state, 'event-result')

  const completedEventId = state.event.currentEventId

  if (completedEventId === 'blessing') {
    state.blessings.nextBlessingThreshold += 100
  } else if (completedEventId === 'fame') {
    state.blessings.fameEventsRemaining = Math.max(
      0,
      state.blessings.fameEventsRemaining - 1,
    )
  }

  state.event.currentEventId = null
  state.event.pendingChoiceId = null
  state.event.resultText = null
  state.event.pendingTimedEvent = false

  const settlement = settleEconomy(state)

  if (!settlement.gameOver) {
    state.progress.gameStatus = 'ready'
  }

  return settlement
}
