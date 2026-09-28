import type { GameState } from '../game/GameState'
import { resolveCurrentMinigameAction } from '../game/EventEngine'
import {
  activateTimedChallenge,
  dismissTimedChallenge,
  expireTimedChallenge,
  isTimedChallengeDue,
  resolveTimedChallenge,
} from '../game/TimedChallengeEngine'
import type { EventDefinition } from '../events/types'

type Rerender = () => void

let challengeWakeTimer: number | null = null
let challengeExpiryTimer: number | null = null
let memorySequenceRunning = false
let memoryRunToken = 0

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms))

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const clearTimer = (
  timer: number | null,
): null => {
  if (timer !== null) {
    window.clearTimeout(timer)
  }
  return null
}

const isSameMemoryRun = (
  state: Readonly<GameState>,
  token: number,
): boolean =>
  token === memoryRunToken &&
  state.progress.gameStatus === 'minigame' &&
  state.event.minigame?.kind === 'memory'

const runMemorySequence = async (
  state: GameState,
  rerender: Rerender,
): Promise<void> => {
  const minigame = state.event.minigame

  if (
    memorySequenceRunning ||
    !minigame ||
    minigame.kind !== 'memory' ||
    minigame.phase !== 'countdown'
  ) {
    return
  }

  memorySequenceRunning = true
  memoryRunToken += 1
  const token = memoryRunToken

  for (let count = 3; count >= 1; count -= 1) {
    if (!isSameMemoryRun(state, token)) {
      memorySequenceRunning = false
      return
    }

    minigame.displayText = String(count)
    minigame.feedback = `${count}초 후 시작합니다.`
    rerender()
    await sleep(1000)
  }

  if (!isSameMemoryRun(state, token)) {
    memorySequenceRunning = false
    return
  }

  minigame.phase = 'reveal'
  minigame.feedback = '순서를 기억하세요.'

  for (const digit of minigame.sequence) {
    if (!isSameMemoryRun(state, token)) {
      memorySequenceRunning = false
      return
    }

    minigame.displayText = digit
    rerender()
    await sleep(800)

    if (!isSameMemoryRun(state, token)) {
      memorySequenceRunning = false
      return
    }

    minigame.displayText = ''
    rerender()
    await sleep(700)
  }

  if (!isSameMemoryRun(state, token)) {
    memorySequenceRunning = false
    return
  }

  minigame.phase = 'input'
  minigame.displayText = null
  minigame.feedback = '기억한 12자리 숫자를 입력하세요.'
  memorySequenceRunning = false
  rerender()
}

const renderNumberGuess = (state: Readonly<GameState>): string => {
  const minigame = state.event.minigame
  if (!minigame) return ''

  const remaining = minigame.maxAttempts - minigame.attemptsUsed

  return `
    <p class="minigame-feedback">${escapeHtml(minigame.feedback ?? '')}</p>
    <p class="minigame-attempts">남은 시도 <strong>${remaining}</strong> / ${minigame.maxAttempts}</p>
    <form class="minigame-form" data-number-guess-form>
      <input
        type="number"
        inputmode="numeric"
        min="1"
        max="99"
        step="1"
        required
        placeholder="1~99"
        aria-label="숫자 추측"
        data-number-guess-input
      />
      <button class="event-choice event-choice--submit" type="submit">입력</button>
    </form>
  `
}

const renderWorship = (state: Readonly<GameState>): string => {
  const minigame = state.event.minigame
  if (!minigame) return ''

  return `
    <p class="minigame-feedback">${escapeHtml(minigame.feedback ?? '')}</p>
    <code class="worship-text" aria-label="예배문">${escapeHtml(minigame.displayText ?? '')}</code>
    <form class="minigame-form minigame-form--stacked" data-worship-form>
      <input
        type="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        required
        aria-label="예배문 입력"
        data-worship-input
      />
      <button class="event-choice event-choice--submit" type="submit">찬양한다</button>
    </form>
  `
}

const renderMemory = (state: Readonly<GameState>): string => {
  const minigame = state.event.minigame
  if (!minigame) return ''

  if (minigame.phase !== 'input') {
    return `
      <p class="minigame-feedback">${escapeHtml(minigame.feedback ?? '')}</p>
      <div class="memory-token" aria-live="assertive">${escapeHtml(minigame.displayText ?? '')}</div>
      <p class="memory-caption">1~3 숫자 · 총 12개</p>
    `
  }

  return `
    <p class="minigame-feedback">${escapeHtml(minigame.feedback ?? '')}</p>
    <form class="minigame-form minigame-form--stacked" data-memory-form>
      <input
        type="text"
        inputmode="numeric"
        pattern="[1-3]{12}"
        minlength="12"
        maxlength="12"
        autocomplete="off"
        required
        placeholder="예: 123132..."
        aria-label="기억한 숫자 입력"
        data-memory-input
      />
      <button class="event-choice event-choice--submit" type="submit">정답 제출</button>
    </form>
  `
}

export const renderMinigamePanel = (
  state: Readonly<GameState>,
  currentEvent: Readonly<EventDefinition>,
): string => {
  const minigame = state.event.minigame
  if (!minigame) return ''

  let body = ''

  if (minigame.kind === 'number-guess') {
    body = renderNumberGuess(state)
  } else if (minigame.kind === 'worship') {
    body = renderWorship(state)
  } else {
    body = renderMemory(state)
  }

  return `
    <section class="event-panel event-panel--minigame" aria-label="Minigame">
      <div class="event-panel__heading">
        <span>MINIGAME</span>
        <span class="event-panel__badge">${escapeHtml(currentEvent.name)}</span>
      </div>
      <h1>${escapeHtml(currentEvent.name)}</h1>
      ${body}
    </section>
  `
}

export const renderTimedChallengeOverlay = (
  state: Readonly<GameState>,
): string => {
  const challenge = state.event.timedChallenge

  if (challenge.status === 'active' && challenge.answer !== null) {
    return `
      <div class="timed-overlay" role="dialog" aria-modal="true" aria-label="시간제한 숫자 입력">
        <section class="timed-card">
          <span class="timed-card__eyebrow">TIME CHALLENGE</span>
          <h2>숫자 ${challenge.answer}</h2>
          <p>1.5초 안에 입력하세요.</p>
          <div class="timed-progress" aria-hidden="true"><span></span></div>
          <form class="timed-form" data-timed-form>
            <input
              type="text"
              inputmode="numeric"
              pattern="[0-9]"
              maxlength="1"
              autocomplete="off"
              required
              aria-label="시간제한 숫자 입력"
              data-timed-input
            />
            <button type="submit">입력</button>
          </form>
        </section>
      </div>
    `
  }

  if (challenge.status === 'resolved') {
    return `
      <div class="timed-overlay" role="dialog" aria-modal="true" aria-label="시간제한 결과">
        <section class="timed-card timed-card--result">
          <span class="timed-card__eyebrow">TIME CHALLENGE</span>
          <h2>결과</h2>
          <p>${escapeHtml(challenge.resultText ?? '')}</p>
          <button class="timed-dismiss" type="button" data-timed-dismiss>계속</button>
        </section>
      </div>
    `
  }

  return ''
}

const focusCurrentInput = (root: ParentNode): void => {
  const input = root.querySelector<HTMLInputElement>(
    '[data-timed-input], [data-number-guess-input], [data-worship-input], [data-memory-input]',
  )
  input?.focus({ preventScroll: true })
}

export const bindInteractiveEventUI = (
  root: HTMLElement,
  state: GameState,
  rerender: Rerender,
): void => {
  const numberForm = root.querySelector<HTMLFormElement>(
    '[data-number-guess-form]',
  )
  numberForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    if (state.progress.gameStatus !== 'minigame') return

    const input = root.querySelector<HTMLInputElement>(
      '[data-number-guess-input]',
    )
    if (!input || !input.reportValidity()) return

    resolveCurrentMinigameAction(state, {
      choiceId: 'guess',
      numericValue: Number(input.value),
    })
    rerender()
  })

  const worshipForm = root.querySelector<HTMLFormElement>(
    '[data-worship-form]',
  )
  worshipForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    if (state.progress.gameStatus !== 'minigame') return

    const input = root.querySelector<HTMLInputElement>(
      '[data-worship-input]',
    )
    if (!input || !input.reportValidity()) return

    resolveCurrentMinigameAction(state, {
      choiceId: 'worship-submit',
      textValue: input.value,
    })
    rerender()
  })

  const memoryForm = root.querySelector<HTMLFormElement>(
    '[data-memory-form]',
  )
  memoryForm?.addEventListener('submit', (event) => {
    event.preventDefault()
    if (state.progress.gameStatus !== 'minigame') return

    const input = root.querySelector<HTMLInputElement>(
      '[data-memory-input]',
    )
    if (!input || !input.reportValidity()) return

    resolveCurrentMinigameAction(state, {
      choiceId: 'memory-submit',
      textValue: input.value,
    })
    rerender()
  })

  const timedForm = root.querySelector<HTMLFormElement>(
    '[data-timed-form]',
  )
  timedForm?.addEventListener('submit', (event) => {
    event.preventDefault()

    const input = root.querySelector<HTMLInputElement>(
      '[data-timed-input]',
    )
    if (!input || !input.reportValidity()) return

    resolveTimedChallenge(state, input.value)
    rerender()
  })

  const dismissButton = root.querySelector<HTMLButtonElement>(
    '[data-timed-dismiss]',
  )
  dismissButton?.addEventListener('click', () => {
    dismissTimedChallenge(state)
    rerender()
  })

  window.requestAnimationFrame(() => {
    focusCurrentInput(root)
  })
}

const scheduleChallengeWake = (
  state: GameState,
  rerender: Rerender,
): void => {
  challengeWakeTimer = clearTimer(challengeWakeTimer)

  const challenge = state.event.timedChallenge
  if (
    challenge.status !== 'scheduled' ||
    challenge.triggerAt === null ||
    state.progress.gameStatus === 'game-over' ||
    state.progress.gameStatus === 'victory'
  ) {
    return
  }

  const now = Date.now()
  const busyWithInput =
    state.progress.gameStatus === 'choice' ||
    state.progress.gameStatus === 'minigame'

  if (isTimedChallengeDue(state, now)) {
    if (busyWithInput) {
      challengeWakeTimer = window.setTimeout(() => {
        scheduleChallengeWake(state, rerender)
      }, 200)
      return
    }

    activateTimedChallenge(state, now)
    window.queueMicrotask(rerender)
    return
  }

  challengeWakeTimer = window.setTimeout(() => {
    scheduleChallengeWake(state, rerender)
  }, Math.max(1, challenge.triggerAt - now))
}

const scheduleChallengeExpiry = (
  state: GameState,
  rerender: Rerender,
): void => {
  challengeExpiryTimer = clearTimer(challengeExpiryTimer)

  const challenge = state.event.timedChallenge
  if (
    challenge.status !== 'active' ||
    challenge.expiresAt === null
  ) {
    return
  }

  const remaining = challenge.expiresAt - Date.now()

  if (remaining <= 0) {
    expireTimedChallenge(state)
    window.queueMicrotask(rerender)
    return
  }

  challengeExpiryTimer = window.setTimeout(() => {
    expireTimedChallenge(state)
    rerender()
  }, remaining)
}

export const syncInteractiveEventUI = (
  state: GameState,
  rerender: Rerender,
): void => {
  scheduleChallengeWake(state, rerender)
  scheduleChallengeExpiry(state, rerender)

  const minigame = state.event.minigame
  if (
    state.progress.gameStatus === 'minigame' &&
    minigame?.kind === 'memory' &&
    minigame.phase === 'countdown'
  ) {
    void runMemorySequence(state, rerender)
  } else if (
    state.progress.gameStatus !== 'minigame' ||
    minigame?.kind !== 'memory'
  ) {
    memoryRunToken += 1
    memorySequenceRunning = false
  }
}
