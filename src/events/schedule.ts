export type EventRandomSource = () => number

export const EVENT_SCHEDULE_MAX_STAGE = 460

const randomIndex = (length: number, random: EventRandomSource): number => {
  if (length <= 0) throw new Error('Cannot choose from an empty event pool.')

  const normalized = Math.min(0.999999999999, Math.max(0, random()))
  return Math.floor(normalized * length)
}

const choose = (
  pool: readonly number[],
  random: EventRandomSource,
): number => pool[randomIndex(pool.length, random)]

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
      schedule.push(choose([1, 13, 12, 4, 14, 11, 15], random))
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
