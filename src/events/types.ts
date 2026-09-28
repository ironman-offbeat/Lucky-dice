import type { EventId } from '../game/GameState'

export type EventCategory =
  | 'system'
  | 'hidden'
  | 'normal'
  | 'special'
  | 'hell'
  | 'rare'

export interface EventChoiceDefinition {
  id: string
  label: string
}

export interface EventNumericInputDefinition {
  id: string
  label: string
  min: number
  max?: number
  maxSource?: 'coin-floor'
  step?: number
  submitLabel: string
  fallbackChoice?: EventChoiceDefinition
}

export interface EventDefinition {
  id: EventId
  name: string
  category: EventCategory
  description: string
  choices: readonly EventChoiceDefinition[]
  numericInput?: EventNumericInputDefinition
  implemented: boolean
}

export interface EventAction {
  choiceId: string
  numericValue?: number
  textValue?: string
}

export interface EventResolution {
  eventId: EventId
  title: string
  message: string
  complete?: boolean
}
