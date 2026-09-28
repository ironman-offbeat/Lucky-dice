export type EventRandomSource = () => number

export const EVENT_SCHEDULE_MAX_STAGE = 460

interface WeightedEvent {
  id: number
  weight: number
}

const STAGE_200_299_POOL: readonly WeightedEvent[] = [
  { id: 1, weight: 12 },
  { id: 13, weight: 12 },
  { id: 12, weight: 12 },
  { id: 4, weight: 12 },
  { id: 14, weight: 12 },
  { id: 11, weight: 12 },
  { id: 15, weight: 12 },
  { id: 9, weight: 4 },
  { id: 10, weight: 4 },
]

const normalizeRandom = (random: EventRandomSource): number =>
  Math.min(0.999999999999, Math.max(0, random()))

const randomIndex = (
  length: number,
  random: EventRandomSource,
): number => {
  if (length <= 0) {
    throw new Error('Cannot choose from an empty event pool.')
  }

  return Math.floor(normalizeRandom(random) * length)
}

const choose = (
  pool: readonly number[],
  random: EventRandomSource,
): number => pool[randomIndex(pool.length, random)]

const chooseWeighted = (
  pool: readonly WeightedEvent[],
  random: EventRandomSource,
): number => {
  if (pool.length === 0) {
    throw new Error('Cannot choose from an empty weighted event pool.')
  }

  const totalWeight = pool.reduce((sum, entry) => {
    if (!Number.isFinite(entry.weight) || entry.weight <= 0) {
      throw new Error(
        `Event ${entry.id} has an invalid weight: ${entry.weight}.`,
      )
    }

    return sum + entry.weight
  }, 0)

  let cursor = normalizeRandom(random) * totalWeight

  for (const entry of pool) {
    cursor -= entry.weight
    if (cursor < 0) return entry.id
  }

  return pool[pool.length - 1].id
}

export const createEventSchedule = (
  random: EventRandomSource = Math.random,
): number[] => {
  // Preserve the original Python indexing: stagenum starts as [0, -1],
  // then 460 generated values are appended.
  const schedule: number[] = [0, -1]

  for (let idea = 1; idea <= EVENT_SCHEDULE_MAX_STAGE; idea += 1) {
    if (idea % 10 === 9) {
      if (idea >= 100 && idea <= 200) {
        schedule.push(choose([50, 52, 53, 54, 55], random))
      } else if (idea > 200 && idea <= 300) {
        schedule.push(choose([50, 51, 54, 55], random))
      } else if (idea > 300) {
        schedule.push(66)
      } else {
        schedule.push(choose([50, 51, 52], random))
      }
      continue
    }

    if (idea > 400) {
      schedule.push(0)
    } else if (idea >= 300 && idea < 400) {
      schedule.push(choose([20, 21, 22, 23], random))
    } else if (idea >= 200 && idea < 300) {
      // Restore worship (9) and memory (10) as low-frequency mid-game
      // variations. Event 7 stays intentionally absent from the schedule.
      schedule.push(chooseWeighted(STAGE_200_299_POOL, random))
    } else if (idea >= 100 && idea < 200) {
      schedule.push(choose([1, 2, 11, 4, 14, 5, 8], random))
    } else {
      schedule.push(choose([1, 2, 3, 4, 5, 6], random))
    }
  }

  // Exactly one rare roulette event per run, matching the original 77/177/277 rule.
  const rareStages = [77, 177, 277] as const
  schedule[rareStages[randomIndex(rareStages.length, random)]] = 77

  return schedule
}

export const scheduledEventIdAt = (
  schedule: readonly number[],
  stage: number,
): number => {
  if (stage <= 0) return 0
  return schedule[stage] ?? 0
}
