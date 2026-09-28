import type { EventId, GameState, MinigameState } from '../game/GameState'
import {
  changeGainBonus,
  changeLossBonus,
  gainCoin,
  loseCoin,
} from '../game/EconomyEngine'
import { scheduleTimedChallenge } from '../game/TimedChallengeEngine'
import type { EventRandomSource } from './schedule'
import type { EventAction, EventResolution } from './types'

type InputNormalEventId = 7 | 9 | 10 | 15

type InputNormalHandler = (
  state: GameState,
  action: EventAction,
  random: EventRandomSource,
) => EventResolution

const INPUT_NORMAL_EVENT_IDS = new Set<EventId>([7, 9, 10, 15])
const ASCII_LETTERS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

const normalizeRandom = (random: EventRandomSource): number =>
  Math.min(0.999999999999, Math.max(0, random()))

const randomIntInclusive = (
  min: number,
  max: number,
  random: EventRandomSource,
): number =>
  min + Math.floor(normalizeRandom(random) * (max - min + 1))

const formatNumber = (value: number): string =>
  Number.isInteger(value)
    ? String(value)
    : String(Math.round(value * 1000) / 1000)

const coinTransition = (before: number, after: number): string =>
  `COIN ${formatNumber(before)} → ${formatNumber(after)}`

const setMinigame = (
  state: GameState,
  minigame: MinigameState,
): void => {
  state.event.minigame = minigame
}

const addCurse = (state: GameState, name: string): boolean => {
  if (state.blessings.curses.includes(name)) return false
  state.blessings.curses.push(name)
  return true
}

const resolveNumberGuess: InputNormalHandler = (
  state,
  action,
  random,
) => {
  const minigame = state.event.minigame

  if (!minigame || minigame.kind !== 'number-guess') {
    setMinigame(state, {
      kind: 'number-guess',
      phase: 'input',
      targetNumber: randomIntInclusive(1, 99, random),
      attemptsUsed: 0,
      maxAttempts: 6,
      expectedText: null,
      displayText: null,
      sequence: [],
      feedback: '1부터 99까지의 자연수 중 하나를 6번 안에 맞히세요.',
    })

    return {
      eventId: 7,
      title: '숫자 맞추기',
      message: '숫자 맞추기를 시작합니다.',
      complete: false,
    }
  }

  const guess = action.numericValue

  if (
    action.choiceId !== 'guess' ||
    guess === undefined ||
    !Number.isInteger(guess) ||
    guess < 1 ||
    guess > 99 ||
    minigame.targetNumber === null
  ) {
    throw new Error('Invalid number-guess input.')
  }

  minigame.attemptsUsed += 1

  if (guess === minigame.targetNumber) {
    const change = gainCoin(state, 2)
    return {
      eventId: 7,
      title: '숫자 맞추기',
      message:
        `${guess}! 정답입니다. 코인 ${formatNumber(change.appliedAmount)}개를 얻었습니다. ` +
        coinTransition(change.coinBefore, change.coinAfter),
    }
  }

  if (minigame.attemptsUsed >= minigame.maxAttempts) {
    const answer = minigame.targetNumber
    const change = loseCoin(state, 2)
    return {
      eventId: 7,
      title: '숫자 맞추기',
      message:
        `6번 안에 맞히지 못했습니다. 정답은 ${answer}였습니다. ` +
        `코인 ${formatNumber(Math.abs(change.appliedAmount))}개를 잃었습니다. ` +
        coinTransition(change.coinBefore, change.coinAfter),
    }
  }

  minigame.feedback =
    guess > minigame.targetNumber
      ? `${guess}은/는 정답보다 큽니다.`
      : `${guess}은/는 정답보다 작습니다.`

  return {
    eventId: 7,
    title: '숫자 맞추기',
    message: minigame.feedback,
    complete: false,
  }
}

const createWorshipText = (
  random: EventRandomSource,
): string => {
  let value = ''

  for (let index = 0; index < 25; index += 1) {
    value +=
      ASCII_LETTERS[
        randomIntInclusive(0, ASCII_LETTERS.length - 1, random)
      ]
  }

  return value
}

const resolveWorship: InputNormalHandler = (
  state,
  action,
  random,
) => {
  const minigame = state.event.minigame

  if (!minigame || minigame.kind !== 'worship') {
    const expectedText = createWorshipText(random)

    setMinigame(state, {
      kind: 'worship',
      phase: 'input',
      targetNumber: null,
      attemptsUsed: 0,
      maxAttempts: 1,
      expectedText,
      displayText: expectedText.split('').join('\u200b'),
      sequence: [],
      feedback: '표시된 예배문을 정확히 입력하세요.',
    })

    return {
      eventId: 9,
      title: '찬양',
      message: '신들이 당신의 신앙심을 확인합니다.',
      complete: false,
    }
  }

  if (
    action.choiceId !== 'worship-submit' ||
    action.textValue === undefined ||
    minigame.expectedText === null
  ) {
    throw new Error('Invalid worship input.')
  }

  const entered = action.textValue

  if (entered === minigame.expectedText) {
    return {
      eventId: 9,
      title: '찬양',
      message:
        '예배문을 정확히 외웠습니다. 당신의 신앙심이 신에게 닿았습니다.',
    }
  }

  changeGainBonus(state, -1)
  changeLossBonus(state, 1)

  const gotCurse = addCurse(state, '신의 분노')
  const copied = entered === minigame.displayText

  return {
    eventId: 9,
    title: '찬양',
    message:
      (copied
        ? '신이 복사·붙여넣기를 알아차리고 분노했습니다.'
        : '잘못된 찬양으로 신이 분노했습니다.') +
      ' 획득 보너스 -1, 손실 보너스 +1' +
      (gotCurse ? ' · 신의 분노 획득' : ''),
  }
}

const resolveMemory: InputNormalHandler = (
  state,
  action,
  random,
) => {
  const minigame = state.event.minigame

  if (!minigame || minigame.kind !== 'memory') {
    const sequence = Array.from(
      { length: 12 },
      () => String(randomIntInclusive(1, 3, random)),
    )

    setMinigame(state, {
      kind: 'memory',
      phase: 'countdown',
      targetNumber: null,
      attemptsUsed: 0,
      maxAttempts: 1,
      expectedText: sequence.join(''),
      displayText: '3',
      sequence,
      feedback: '3초 후 숫자 12개가 순서대로 나타납니다.',
    })

    return {
      eventId: 10,
      title: '기억',
      message: '12개의 숫자 순서를 기억하세요.',
      complete: false,
    }
  }

  if (
    minigame.phase !== 'input' ||
    action.choiceId !== 'memory-submit' ||
    action.textValue === undefined ||
    minigame.expectedText === null
  ) {
    throw new Error('Invalid memory input.')
  }

  if (action.textValue === minigame.expectedText) {
    const change = gainCoin(state, 2)

    return {
      eventId: 10,
      title: '기억',
      message:
        `12개의 숫자를 모두 기억했습니다. 코인 ${formatNumber(change.appliedAmount)}개를 얻었습니다. ` +
        coinTransition(change.coinBefore, change.coinAfter),
    }
  }

  const answer = minigame.expectedText
  const change = loseCoin(state, 2)

  return {
    eventId: 10,
    title: '기억',
    message:
      `기억에 실패했습니다. 정답은 ${answer}였습니다. ` +
      `코인 ${formatNumber(Math.abs(change.appliedAmount))}개를 잃었습니다. ` +
      coinTransition(change.coinBefore, change.coinAfter),
  }
}

const resolveTimedInput: InputNormalHandler = (
  state,
  _action,
  random,
) => {
  const answer = randomIntInclusive(0, 9, random)
  const scheduled = scheduleTimedChallenge(state, answer)

  if (!scheduled) {
    return {
      eventId: 15,
      title: '쉬어가기',
      message:
        '이미 시간제한 도전이 대기 중이어서 아무 일도 일어나지 않았습니다.',
    }
  }

  return {
    eventId: 15,
    title: '1분 후 숫자 입력',
    message:
      `60초 후 게임 도중 입력창이 나타납니다. 1.5초 안에 숫자 ${answer}을/를 입력하세요.`,
  }
}

const handlers: Record<
  InputNormalEventId,
  InputNormalHandler
> = {
  7: resolveNumberGuess,
  9: resolveWorship,
  10: resolveMemory,
  15: resolveTimedInput,
}

const isInputNormalEventId = (
  eventId: EventId,
): eventId is InputNormalEventId =>
  INPUT_NORMAL_EVENT_IDS.has(eventId)

export const resolveInputNormalEvent = (
  state: GameState,
  eventId: EventId,
  action: EventAction,
  random: EventRandomSource = Math.random,
): EventResolution | null => {
  if (!isInputNormalEventId(eventId)) return null
  return handlers[eventId](state, action, random)
}
