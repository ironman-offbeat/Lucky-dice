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

export interface EventDefinition {
  id: EventId
  name: string
  category: EventCategory
  description: string
  choices: readonly EventChoiceDefinition[]
  implemented: boolean
}

export interface EventResolution {
  eventId: EventId
  title: string
  message: string
}
