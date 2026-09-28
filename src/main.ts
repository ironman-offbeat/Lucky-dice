import './styles/game.css'
import { consumeSpecialDice } from './game/BlessingEngine'
import {
  beginMove,
  beginRoll,
  completeMove,
  revealRoll,
  type StageMoveResult,
} from './game/GameEngine'
import {
  completeCurrentEvent,
  getCurrentEventDefinition,
  initializeEventSchedule,
  prepareCurrentEvent,
  resolveCurrentEventAction,
} from './game/EventEngine'
import type { GameStatus } from './game/GameState'
import {
  canPersistGameState,
  createNewGameState,
  deleteSavedGame,
  loadGame,
  saveGame,
  type SaveLoadResult,
} from './game/SaveEngine'
import {
  bindInteractiveEventUI,
  renderMinigamePanel,
  renderTimedChallengeOverlay,
  syncInteractiveEventUI,
} from './ui/MinigameUI'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root was not found.')
}

const startupSave = loadGame()
let state = createNewGameState()
initializeEventSchedule(state)

type LaunchMode = 'playing' | 'resume-prompt'

let launchMode: LaunchMode =
  startupSave.ok ? 'resume-prompt' : 'playing'
let lastSavedAt: number | null =
  startupSave.ok ? startupSave.savedAt : null
let lastPersistedFingerprint: string | null =
  startupSave.ok ? JSON.stringify(startupSave.state) : null
let persistenceNotice =
  !startupSave.ok &&
  startupSave.reason !== 'missing'
    ? '기존 저장 데이터를 읽지 못해 새 게임 상태로 시작합니다.'
    : ''

let currentMove: StageMoveResult | null = null
let runeTimer: number | null = null
let visibleRunes = ['⌁', 'ᚱ', '⌬']

const RUNE_SETS = [
  ['⌁', 'ᚱ', '⌬'],
  ['⟁', 'ᚣ', '✶'],
  ['☍', '⌘', '⟐'],
  ['ᛝ', '◈', 'ᚦ'],
  ['⌖', 'ᛉ', '⋈'],
  ['ᚺ', '⍟', '⌗'],
] as const

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const timing = prefersReducedMotion
  ? { roll: 80, result: 80, move: 80 }
  : { roll: 950, result: 650, move: 450 }

const sleep = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms))

const visualRandomIndex = (length: number): number => {
  if (length <= 1) return 0

  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] % length
}

const nextRuneSet = (): string[] => [...RUNE_SETS[visualRandomIndex(RUNE_SETS.length)]]

const startRuneShuffle = (): void => {
  stopRuneShuffle()
  visibleRunes = nextRuneSet()
  runeTimer = window.setInterval(() => {
    visibleRunes = nextRuneSet()
    updateRunesOnly()
  }, 85)
}

const stopRuneShuffle = (): void => {
  if (runeTimer !== null) {
    window.clearInterval(runeTimer)
    runeTimer = null
  }
}

const gaugeMaxFor = (coin: number): number => {
  if (coin <= 10) return 10
  if (coin <= 25) return 25
  if (coin <= 50) return 50
  if (coin <= 100) return 100
  if (coin <= 250) return 250
  if (coin <= 500) return 500
  if (coin <= 1000) return 1000
  return Math.ceil(coin / 1000) * 1000
}

const formatNumber = (value: number): string => Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000)
const signed = (value: number): string => value >= 0 ? `+${formatNumber(value)}` : formatNumber(value)
const currentGameStatus = (): GameStatus => state.progress.gameStatus

const saveFailureCopy = (result: SaveLoadResult): string => {
  if (result.ok) return ''
  switch (result.reason) {
    case 'missing': return '저장 데이터가 없습니다.'
    case 'unsupported-version': return '현재 버전에서 읽을 수 없는 저장 데이터입니다.'
    case 'invalid-json':
    case 'invalid-state': return '저장 데이터가 손상되어 불러올 수 없습니다.'
    case 'storage-unavailable': return '이 브라우저에서는 LocalStorage를 사용할 수 없습니다.'
    default: return '현재 상태에서는 저장할 수 없습니다.'
  }
}

const formatSaveTime = (savedAt: number): string =>
  new Date(savedAt).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const shouldSkipAutosave = (): boolean =>
  state.progress.gameStatus === 'minigame' &&
  state.event.minigame?.kind === 'memory' &&
  state.event.minigame.phase !== 'input'

const persistState = (force = false, manual = false): boolean => {
  if (launchMode !== 'playing') return false
  if (!canPersistGameState(state)) return false
  if (shouldSkipAutosave() && !force) return false

  const memorySaveRequested = state.inventory.memorySaveRequested
  const fingerprint = JSON.stringify(state)
  if (!force && !memorySaveRequested && fingerprint === lastPersistedFingerprint) return true

  const result = saveGame(state)
  if (!result.ok) {
    if (manual || memorySaveRequested) {
      persistenceNotice = result.reason === 'unstable-state'
        ? '현재 연출 중에는 저장할 수 없습니다.'
        : '저장에 실패했습니다.'
    }
    return false
  }

  state.inventory.memorySaveRequested = false
  lastSavedAt = result.savedAt
  lastPersistedFingerprint = JSON.stringify(state)
  if (memorySaveRequested) {
    persistenceNotice = '메모리세이버로 현재 진행 상태를 저장했습니다.'
  } else if (manual) {
    persistenceNotice = '현재 진행 상태를 저장했습니다.'
  }
  return true
}

const restoreState = (result: SaveLoadResult): boolean => {
  if (!result.ok) {
    persistenceNotice = saveFailureCopy(result)
    return false
  }
  stopRuneShuffle()
  state = structuredClone(result.state)
  initializeEventSchedule(state)
  currentMove = null
  visibleRunes = nextRuneSet()
  lastSavedAt = result.savedAt
  lastPersistedFingerprint = JSON.stringify(state)
  persistenceNotice = '저장된 진행 상태를 불러왔습니다.'
  launchMode = 'playing'
  return true
}

const startNewGame = (): void => {
  stopRuneShuffle()
  deleteSavedGame()
  state = createNewGameState()
  initializeEventSchedule(state)
  currentMove = null
  visibleRunes = nextRuneSet()
  lastSavedAt = null
  lastPersistedFingerprint = null
  persistenceNotice = '새 게임을 시작했습니다.'
  launchMode = 'playing'
}

const renderResumePrompt = (): void => {
  if (!startupSave.ok) return
  app.innerHTML = `
    <main class="resume-shell" aria-label="Saved game">
      <section class="resume-card">
        <span class="resume-card__eyebrow">LUCKY DICE</span>
        <h1>저장된 여정이 있습니다</h1>
        <div class="resume-card__stats">
          <div><span>STAGE</span><strong>${startupSave.state.progress.stage}</strong></div>
          <div><span>COIN</span><strong>${formatNumber(startupSave.state.economy.coin)}</strong></div>
        </div>
        <p>마지막 저장 ${formatSaveTime(startupSave.savedAt)}</p>
        <button class="primary-action" type="button" data-action="continue-game">CONTINUE</button>
        <button class="secondary-action" type="button" data-action="new-game">NEW GAME</button>
      </section>
    </main>
  `
  app.querySelector<HTMLButtonElement>('[data-action="continue-game"]')?.addEventListener('click', () => {
    restoreState(startupSave)
    render()
  })
  app.querySelector<HTMLButtonElement>('[data-action="new-game"]')?.addEventListener('click', () => {
    startNewGame()
    render()
  })
}
const statusLabel = (status: GameStatus): string => {
  switch (status) {
    case 'rolling':
      return 'ROLLING'
    case 'result':
      return 'RESULT'
    case 'moving':
      return 'MOVING'
    case 'event':
      return 'EVENT READY'
    case 'choice':
      return 'CHOICE'
    case 'minigame':
      return 'MINIGAME'
    case 'event-result':
      return 'EVENT RESULT'
    case 'victory':
      return 'COMPLETE'
    case 'game-over':
      return 'GAME OVER'
    default:
      return 'READY'
  }
}

const focusCopy = (): { eyebrow: string; button: string; disabled: boolean } => {
  switch (state.progress.gameStatus) {
    case 'rolling':
      return { eyebrow: '운명이 굴러갑니다', button: '굴리는 중…', disabled: true }
    case 'result':
      return { eyebrow: '주사위가 멈췄습니다', button: '결과 확인', disabled: true }
    case 'moving':
      return { eyebrow: '여정을 이동합니다', button: '이동 중…', disabled: true }
    case 'event':
      return { eyebrow: '이동이 완료되었습니다', button: '이벤트 계산 중', disabled: true }
    case 'choice':
      return { eyebrow: '새로운 사건이 기다립니다', button: '이벤트 진행 중', disabled: true }
    case 'minigame':
      return { eyebrow: '도전이 진행 중입니다', button: '도전 진행 중', disabled: true }
    case 'event-result':
      return { eyebrow: '사건의 결과가 정해졌습니다', button: '결과 처리 중', disabled: true }
    case 'victory':
      return { eyebrow: '여정의 끝에 도달했습니다', button: 'JOURNEY COMPLETE', disabled: true }
    case 'game-over':
      return { eyebrow: '더 이상 여정을 계속할 수 없습니다', button: 'GAME OVER', disabled: true }
    default:
      return { eyebrow: '운명을 굴릴 준비가 되었습니다', button: '주사위 굴리기', disabled: false }
  }
}

const renderRollReadout = (): string => {
  if (!currentMove || state.progress.gameStatus === 'ready' || state.progress.gameStatus === 'rolling') {
    return '<div class="roll-readout roll-readout--empty" aria-hidden="true"></div>'
  }

  const moveClass = currentMove.finalMove < 0 ? ' roll-readout__move--negative' : ''

  return `
    <div class="roll-readout" aria-live="polite">
      <div><span>주사위 결과</span><strong>${currentMove.rawRoll}</strong></div>
      <div><span>보정</span><strong>${signed(currentMove.modifierApplied + currentMove.accessoryBonus)}</strong></div>
      <div class="roll-readout__move${moveClass}"><span>MOVE</span><strong>${signed(currentMove.finalMove)}</strong></div>
    </div>
  `
}

const renderSpecialDiceControl = (): string => {
  if (
    !state.dice.specialDiceAvailable ||
    state.progress.gameStatus !== 'ready'
  ) {
    return ''
  }

  return `
    <div class="special-dice-control" aria-label="주사위의 축복">
      <div class="special-dice-control__copy">
        <span>50-SIDED BLESSING</span>
        <strong>1회 사용 가능</strong>
      </div>
      <div class="special-dice-control__row">
        <input
          type="number"
          inputmode="numeric"
          min="1"
          max="50"
          step="1"
          value="1"
          aria-label="50면체 이동거리"
          data-special-dice-input
        />
        <button
          type="button"
          data-action="special-dice"
        >선택 이동</button>
      </div>
    </div>
  `
}
const renderEventPanel = (): string => {
  if (state.progress.gameStatus === 'victory' && currentMove) {
    return `
      <section class="event-panel event-panel--victory" aria-label="Victory">
        <div class="event-panel__heading">
          <span>JOURNEY</span>
          <span class="event-panel__badge">COMPLETE</span>
        </div>
        <h1>여정의 끝</h1>
        <p>Stage ${currentMove.stageBefore}에서 ${currentMove.finalMove >= 0 ? '전진' : '후진'}하여 Stage ${state.progress.stage}에 도달했습니다.</p>
      </section>
    `
  }

  if (state.progress.gameStatus === 'game-over') {
    return `
      <section class="event-panel event-panel--game-over" aria-label="Game over">
        <div class="event-panel__heading">
          <span>JOURNEY</span>
          <span class="event-panel__badge">GAME OVER</span>
        </div>
        <h1>여정 종료</h1>
        <p>모든 코인을 잃었습니다. 최종 도달 Stage는 <strong>${state.progress.stage}</strong>입니다.</p>
      </section>
    `
  }

  const currentEvent = getCurrentEventDefinition(state)

  if (state.progress.gameStatus === 'minigame' && currentEvent) {
    return renderMinigamePanel(state, currentEvent)
  }

  if (state.progress.gameStatus === 'choice' && currentEvent) {
    const choices = currentEvent.choices
      .map(
        (choice) => `
          <button
            class="event-choice"
            type="button"
            data-event-choice="${choice.id}"
          >${choice.label}</button>
        `,
      )
      .join('')

    const numericInput = currentEvent.numericInput
    let numericControl = ''

    if (numericInput) {
      const max =
        numericInput.maxSource === 'coin-floor'
          ? Math.floor(state.economy.coin)
          : numericInput.max ?? Number.POSITIVE_INFINITY

      if (max >= numericInput.min) {
        numericControl = `
          <div class="event-number-control">
            <label for="event-number-input">${numericInput.label}</label>
            <div class="event-number-control__row">
              <input
                id="event-number-input"
                type="number"
                inputmode="numeric"
                min="${numericInput.min}"
                ${Number.isFinite(max) ? `max="${max}"` : ''}
                step="${numericInput.step ?? 1}"
                value="${numericInput.min}"
                data-event-number
              />
              <button
                class="event-choice event-choice--submit"
                type="button"
                data-event-number-submit="${numericInput.id}"
              >${numericInput.submitLabel}</button>
            </div>
            ${Number.isFinite(max) ? `<span class="event-number-control__hint">선택 가능: ${numericInput.min}~${max}</span>` : ''}
          </div>
        `
      } else if (numericInput.fallbackChoice) {
        numericControl = `
          <button
            class="event-choice"
            type="button"
            data-event-choice="${numericInput.fallbackChoice.id}"
          >${numericInput.fallbackChoice.label}</button>
        `
      }
    }

    return `
      <section class="event-panel event-panel--active" aria-label="Current event">
        <div class="event-panel__heading">
          <span>${currentEvent.category.toUpperCase()}</span>
          <span class="event-panel__badge">EVENT</span>
        </div>
        <h1>${currentEvent.name}</h1>
        ${currentMove ? `<p class="stage-move-line"><strong>${currentMove.stageBefore}</strong><span>→</span><strong>${currentMove.stageAfter}</strong></p>` : ''}
        <p>${currentEvent.description}</p>
        <div class="event-choice-list">
          ${choices}
          ${numericControl}
        </div>
        <p class="event-meta">EVENT ${String(currentEvent.id)} · ${currentEvent.implemented ? 'IMPLEMENTED' : 'FRAMEWORK READY'}</p>
      </section>
    `
  }

  if (state.progress.gameStatus === 'event-result' && currentEvent) {
    return `
      <section class="event-panel event-panel--result" aria-label="Event result">
        <div class="event-panel__heading">
          <span>RESULT</span>
          <span class="event-panel__badge">${currentEvent.name}</span>
        </div>
        <h1>결과</h1>
        <p class="event-result-copy">${state.event.resultText ?? '이벤트 결과를 처리했습니다.'}</p>
        <button class="secondary-action" type="button" data-action="complete-event">다음 턴</button>
      </section>
    `
  }

  return `
    <section class="event-panel" aria-label="Event area">
      <div class="event-panel__heading">
        <span>EVENT</span>
        <span class="event-panel__badge">${statusLabel(state.progress.gameStatus)}</span>
      </div>
      <h1>${state.progress.stage === 0 ? '여정의 시작' : `Stage ${state.progress.stage}`}</h1>
      <p>주사위가 멈추는 곳에서 다음 사건이 시작됩니다.</p>
      <div class="choice-placeholder" aria-hidden="true">
        <span></span>
        <span></span>
      </div>
    </section>
  `
}

const render = (): void => {
  if (launchMode === 'resume-prompt') {
    renderResumePrompt()
    return
  }

  persistState()

  const gaugeMax = gaugeMaxFor(state.economy.coin)
  const gaugePercent = Math.min(100, Math.max(0, (state.economy.coin / gaugeMax) * 100))
  const focus = focusCopy()
  const coinDangerClass = state.economy.coin <= 3 ? ' coin-panel--danger' : ''
  const rollingClass = state.progress.gameStatus === 'rolling' ? ' dummy-die--rolling' : ''
  const resultClass = state.progress.gameStatus === 'result' ? ' dummy-die--result' : ''
  const movingClass = state.progress.gameStatus === 'moving' ? ' dummy-die--moving' : ''
  const negativeClass = currentMove !== null && currentMove.finalMove < 0 ? ' focus-panel--negative' : ''

  app.innerHTML = `
    <main class="game-shell${state.progress.isHell ? ' game-shell--hell' : ''}" aria-label="Lucky Dice game">
      <header class="hud">
        <div class="hud__topline">
          <div class="brand">
            <span class="brand__mark" aria-hidden="true">◆</span>
            <span>LUCKY DICE</span>
          </div>
          <div class="stage-label">STAGE <strong>${state.progress.stage}</strong> / 400</div>
        </div>

        <section class="coin-panel${coinDangerClass}" aria-label="Coin status">
          <div class="coin-panel__label-row">
            <span class="coin-panel__label">COIN</span>
            <strong class="coin-panel__value">${formatNumber(state.economy.coin)}</strong>
          </div>
          <div
            class="coin-gauge"
            role="progressbar"
            aria-label="Coin survival gauge"
            aria-valuemin="0"
            aria-valuemax="${gaugeMax}"
            aria-valuenow="${state.economy.coin}"
          >
            <div class="coin-gauge__fill" style="width: ${gaugePercent}%"></div>
          </div>
          <div class="coin-panel__scale">0 <span>${gaugeMax}</span></div>
        </section>

        <div class="stats-strip" aria-label="Current modifiers">
          <div><span>획득</span><strong>${signed(state.economy.coinGainBonus)}</strong></div>
          <div><span>손실</span><strong>${signed(state.economy.coinLossBonus)}</strong></div>
          <div><span>주사위</span><strong>${signed(state.dice.modifier)}</strong></div>
        </div>
      </header>

      <section class="focus-panel${negativeClass}" aria-label="Dice area">
        <div class="dice-orbit" aria-hidden="true">
          <div class="dummy-die${rollingClass}${resultClass}${movingClass}" data-die>
            <span class="rune rune--1" data-rune="0">${visibleRunes[0]}</span>
            <span class="rune rune--2" data-rune="1">${visibleRunes[1]}</span>
            <span class="rune rune--3" data-rune="2">${visibleRunes[2]}</span>
          </div>
        </div>
        <p class="focus-panel__eyebrow">${focus.eyebrow}</p>
        ${renderRollReadout()}
        ${renderSpecialDiceControl()}
        <button class="primary-action" type="button" data-action="roll" ${focus.disabled ? 'disabled' : ''}>${focus.button}</button>
        <p class="phase-note">Phase 9A · Local Save</p>
      </section>

      ${renderEventPanel()}

      <section class="save-bar" aria-label="Save controls">
        <div class="save-bar__actions">
          <button type="button" data-action="save-game" ${canPersistGameState(state) && !shouldSkipAutosave() ? '' : 'disabled'}>SAVE</button>
          <button type="button" data-action="load-game" ${lastSavedAt === null ? 'disabled' : ''}>LOAD</button>
        </div>
        <span>${persistenceNotice || (lastSavedAt !== null ? `AUTO · ${formatSaveTime(lastSavedAt)}` : 'AUTO SAVE READY')}</span>
      </section>

      <footer class="inventory-bar">
        <button type="button" disabled><span>✦</span> 축복 <strong>${state.blessings.owned.length}</strong></button>
        <button type="button" disabled><span>▣</span> 악세사리 <strong>${state.inventory.ownedAccessories.length}</strong></button>
      </footer>
    </main>
    ${renderTimedChallengeOverlay(state)}
  `

  bindActions()
  bindInteractiveEventUI(app, state, render)
  syncInteractiveEventUI(state, render)
}

const updateRunesOnly = (): void => {
  const runeNodes = app.querySelectorAll<HTMLElement>('[data-rune]')
  runeNodes.forEach((node) => {
    const index = Number(node.dataset.rune)
    node.textContent = visibleRunes[index] ?? ''
  })
}

const playRollSequence = async (): Promise<void> => {
  if (state.progress.gameStatus !== 'ready') return

  currentMove = beginRoll(state)
  visibleRunes = nextRuneSet()
  render()
  startRuneShuffle()

  await sleep(timing.roll)
  stopRuneShuffle()
  visibleRunes = nextRuneSet()
  revealRoll(state)
  render()

  await sleep(timing.result)
  beginMove(state)
  render()

  await sleep(timing.move)
  completeMove(state, currentMove)
  if (currentGameStatus() === 'event') {
    prepareCurrentEvent(state)
  }
  render()
}

const handleCompleteEvent = (): void => {
  if (state.progress.gameStatus !== 'event-result') return
  completeCurrentEvent(state)

  const statusAfterEvent = currentGameStatus()
  if (statusAfterEvent === 'ready' || statusAfterEvent === 'game-over') {
    currentMove = null
  }

  visibleRunes = nextRuneSet()
  render()
}

const bindActions = (): void => {
  const rollButton = app.querySelector<HTMLButtonElement>('[data-action="roll"]')
  rollButton?.addEventListener('click', () => {
    void playRollSequence()
  })

  const specialDiceButton = app.querySelector<HTMLButtonElement>(
    '[data-action="special-dice"]',
  )
  specialDiceButton?.addEventListener('click', () => {
    if (state.progress.gameStatus !== 'ready') return

    const input = app.querySelector<HTMLInputElement>(
      '[data-special-dice-input]',
    )
    if (!input || !input.reportValidity()) return

    consumeSpecialDice(state, Number(input.value))
    void playRollSequence()
  })
  const saveButton = app.querySelector<HTMLButtonElement>('[data-action="save-game"]')
  saveButton?.addEventListener('click', () => {
    persistState(true, true)
    render()
  })

  const loadButton = app.querySelector<HTMLButtonElement>('[data-action="load-game"]')
  loadButton?.addEventListener('click', () => {
    restoreState(loadGame())
    render()
  })
  const choiceButtons = app.querySelectorAll<HTMLButtonElement>('[data-event-choice]')
  choiceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const choiceId = button.dataset.eventChoice
      if (!choiceId || state.progress.gameStatus !== 'choice') return
      resolveCurrentEventAction(state, { choiceId })
      persistState(true)
      render()
    })
  })

  const numericSubmitButton = app.querySelector<HTMLButtonElement>('[data-event-number-submit]')
  numericSubmitButton?.addEventListener('click', () => {
    if (state.progress.gameStatus !== 'choice') return

    const input = app.querySelector<HTMLInputElement>('[data-event-number]')
    const choiceId = numericSubmitButton.dataset.eventNumberSubmit

    if (!input || !choiceId || !input.reportValidity()) return

    resolveCurrentEventAction(state, {
      choiceId,
      numericValue: Number(input.value),
    })
    persistState(true)
    render()
  })

  const nextTurnButton = app.querySelector<HTMLButtonElement>('[data-action="complete-event"]')
  nextTurnButton?.addEventListener('click', handleCompleteEvent)
}

render()
