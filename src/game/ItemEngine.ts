import type { GameState } from './GameState'
import {
  changeGainBonus,
  changeLossBonus,
  grantCoin,
  setCoin,
  setGainBonus,
  setLossBonus,
} from './EconomyEngine'
import { applyEventStageDelta } from './GameEngine'
import type { EventRandomSource } from '../events/schedule'
import type { ItemId } from '../data/items'

export interface ItemEffectResult {
  message: string
  endEvent: boolean
}

const addOwnedItem = (
  state: GameState,
  itemId: ItemId,
): void => {
  if (!state.inventory.ownedAccessories.includes(itemId)) {
    state.inventory.ownedAccessories.push(itemId)
  }
}

const normalizeRandom = (random: EventRandomSource): number =>
  Math.min(0.999999999999, Math.max(0, random()))

const rollQuarter = (random: EventRandomSource): 1 | 2 | 3 | 4 =>
  (1 + Math.floor(normalizeRandom(random) * 4)) as 1 | 2 | 3 | 4

export const applyItemEffect = (
  state: GameState,
  itemId: ItemId,
  random: EventRandomSource = Math.random,
): ItemEffectResult => {
  addOwnedItem(state, itemId)

  switch (itemId) {
    case '하급악마계약서':
      changeGainBonus(state, 1)
      changeLossBonus(state, 1)
      return {
        message: '하급 악마와 계약했습니다. 획득 보너스 +1, 손실 보너스 +1.',
        endEvent: false,
      }

    case '중급악마계약서':
      grantCoin(state, 10)
      changeLossBonus(state, 1)
      state.dice.modifier -= 1
      return {
        message: '중급 악마와 계약했습니다. 코인 +10, 손실 보너스 +1, 주사위 보정 -1.',
        endEvent: false,
      }

    case '상급악마계약서':
      grantCoin(state, 15)
      changeLossBonus(state, 2)
      state.dice.modifier -= 1
      return {
        message: '상급 악마와 계약했습니다. 코인 +15, 손실 보너스 +2, 주사위 보정 -1.',
        endEvent: false,
      }

    case '주사위저금통':
      state.dice.diceBank = true
      return {
        message: '주사위저금통을 획득했습니다. 일반 주사위를 굴릴 때마다 코인 +0.5.',
        endEvent: false,
      }

    case '붕대':
      state.dice.modifier += 1
      return {
        message: '붕대를 사용했습니다. 주사위 보정 +1.',
        endEvent: false,
      }

    case '균형의수호자':
      state.economy.coinRounding = true
      return {
        message: '균형의 수호자를 획득했습니다. 이벤트 정산 시 소수 코인을 올림합니다.',
        endEvent: false,
      }

    case '칭찬스티커':
      changeLossBonus(state, -1)
      return {
        message: '칭찬스티커를 받았습니다. 손실 보너스 -1.',
        endEvent: false,
      }

    case '마왕계약서':
      grantCoin(state, 30)
      changeLossBonus(state, 10)
      changeGainBonus(state, 5)
      state.hidden.demonInterest += 1
      return {
        message: '마왕과 계약했습니다. 코인 +30, 손실 보너스 +10, 획득 보너스 +5, 마왕의 관심 +1.',
        endEvent: false,
      }

    case 'D의 환생서': {
      const outcome = rollQuarter(random)

      if (outcome === 1) {
        setCoin(state, 0)
        return {
          message: '환생에 실패했습니다. 코인이 0이 되었습니다.',
          endEvent: false,
        }
      }

      if (outcome === 3) {
        changeGainBonus(state, -1)
        return {
          message: '불완전한 환생입니다. 획득 보너스 -1.',
          endEvent: false,
        }
      }

      setLossBonus(state, 0)
      changeGainBonus(state, 5)
      return {
        message: '환생에 성공했습니다. 손실 보너스 0, 획득 보너스 +5.',
        endEvent: false,
      }
    }

    case '시간의 모래시계': {
      const move = applyEventStageDelta(state, -50)
      return {
        message: `시간이 되돌아갔습니다. STAGE ${move.stageBefore} → ${move.stageAfter}.`,
        endEvent: true,
      }
    }

    case '메모리세이버':
      state.inventory.memorySaveRequested = true
      return {
        message: '메모리세이버를 활성화했습니다. 웹 세이브 연결을 위한 저장 요청이 기록되었습니다.',
        endEvent: false,
      }

    case '무신론': {
      changeGainBonus(state, 5)
      changeLossBonus(state, -5)
      state.blessings.nextBlessingThreshold = Number.MAX_SAFE_INTEGER

      const blessingCount = state.blessings.owned.length
      let curseText = '신들은 당신에게 관심을 보이지 않았습니다.'

      if (blessingCount >= 1) {
        state.dice.modifier -= 1
        curseText = '신의 분노: 주사위 보정 -1.'
      }
      if (blessingCount >= 2) {
        state.dice.modifier -= 1
        changeLossBonus(state, 1)
        curseText += ' 추가 저주: 주사위 보정 -1, 손실 보너스 +1.'
      }
      if (blessingCount >= 4) {
        state.dice.modifier -= 4
        curseText += ' 재앙: 주사위 보정 -4.'
      }

      return {
        message: `신앙을 버렸습니다. 획득 보너스 +5, 손실 보너스 -5, 이후 축복 차단. ${curseText}`,
        endEvent: false,
      }
    }

    case '어둠의 주사위':
      state.dice.type = 'dark'
      state.dice.faces = [-2, -1, 2, 3, 5, 8]
      return {
        message: '어둠의 주사위를 장착했습니다. 눈금이 -2, -1, 2, 3, 5, 8로 변경되었습니다.',
        endEvent: false,
      }

    case '역행성': {
      const move = applyEventStageDelta(state, -state.progress.stage)
      setGainBonus(state, 0)
      return {
        message: `시간의 뒤틀림이 발생했습니다. STAGE ${move.stageBefore} → 0, 획득 보너스 0.`,
        endEvent: true,
      }
    }
  }
}
