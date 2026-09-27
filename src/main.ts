import './styles/game.css'
import { INITIAL_GAME_STATE } from './game/GameState'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root was not found.')
}

const state = structuredClone(INITIAL_GAME_STATE)

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

const gaugeMax = gaugeMaxFor(state.economy.coin)
const gaugePercent = Math.min(100, Math.max(0, (state.economy.coin / gaugeMax) * 100))

app.innerHTML = `
  <main class="game-shell" aria-label="Lucky Dice game shell">
    <header class="hud">
      <div class="hud__topline">
        <div class="brand">
          <span class="brand__mark" aria-hidden="true">◆</span>
          <span>LUCKY DICE</span>
        </div>
        <div class="stage-label">STAGE <strong>${state.progress.stage}</strong> / 400</div>
      </div>

      <section class="coin-panel" aria-label="Coin status">
        <div class="coin-panel__label-row">
          <span class="coin-panel__label">COIN</span>
          <strong class="coin-panel__value">${state.economy.coin}</strong>
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
        <div><span>획득</span><strong>+${state.economy.coinGainBonus}</strong></div>
        <div><span>손실</span><strong>+${state.economy.coinLossBonus}</strong></div>
        <div><span>주사위</span><strong>${state.dice.modifier >= 0 ? '+' : ''}${state.dice.modifier}</strong></div>
      </div>
    </header>

    <section class="focus-panel" aria-label="Dice area">
      <div class="dice-orbit" aria-hidden="true">
        <div class="dummy-die">
          <span class="rune rune--1">⌁</span>
          <span class="rune rune--2">ᚱ</span>
          <span class="rune rune--3">⌬</span>
        </div>
      </div>
      <p class="focus-panel__eyebrow">운명을 굴릴 준비가 되었습니다</p>
      <button class="primary-action" type="button" disabled>주사위 굴리기</button>
      <p class="phase-note">Phase 2 UI Shell · 게임 로직은 Phase 3에서 연결</p>
    </section>

    <section class="event-panel" aria-label="Event area">
      <div class="event-panel__heading">
        <span>EVENT</span>
        <span class="event-panel__badge">READY</span>
      </div>
      <h1>여정의 시작</h1>
      <p>주사위가 멈추는 곳에서 다음 사건이 시작됩니다.</p>
      <div class="choice-placeholder" aria-hidden="true">
        <span></span>
        <span></span>
      </div>
    </section>

    <footer class="inventory-bar">
      <button type="button" disabled><span>✦</span> 축복 <strong>${state.blessings.owned.length}</strong></button>
      <button type="button" disabled><span>▣</span> 악세사리 <strong>${state.inventory.ownedAccessories.length}</strong></button>
    </footer>
  </main>
`
