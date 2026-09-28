import type { EventId, GameState } from '../game/GameState'
import {
  changeLossBonus,
  loseCoin,
  spendCoin,
} from '../game/EconomyEngine'
import type { EventAction, EventResolution } from './types'

type HellEventId = 20 | 21 | 22 | 23 | 24

const HELL_EVENT_IDS = new Set<EventId>([20, 21, 22, 23, 24])

const roundHalfToEven = (value: number): number => {
  const floor = Math.floor(value)
  const fraction = value - floor

  if (fraction < 0.5) return floor
  if (fraction > 0.5) return floor + 1

  return floor % 2 === 0 ? floor : floor + 1
}

export const resolveHellEvent = (
  state: GameState,
  eventId: EventId,
  _action: EventAction,
): EventResolution | null => {
  if (!HELL_EVENT_IDS.has(eventId)) return null

  switch (eventId as HellEventId) {
    case 20: {
      const change = loseCoin(state, 3)
      return {
        eventId,
        title: '지옥 · 악마의 추격',
        message:
          `악마에게서 도망치다 코인 ${Math.abs(change.appliedAmount)}개를 잃었습니다. ` +
          `COIN ${change.coinBefore} → ${change.coinAfter}`,
      }
    }

    case 21:
      state.dice.modifier -= 0.5
      return {
        eventId,
        title: '지옥 · 용암',
        message:
          '용암 위를 건너다 화상을 입었습니다. 주사위 보정이 -0.5 감소했습니다.',
      }

    case 22:
      changeLossBonus(state, 1)
      return {
        eventId,
        title: '지옥 · 이름 모를 악마',
        message:
          '이름 모를 악마의 저주를 받았습니다. 손실 보너스가 +1 증가했습니다.',
      }

    case 23:
      changeLossBonus(state, 2)
      return {
        eventId,
        title: '지옥 · 숨어있던 악마',
        message:
          '숨어있던 악마의 공격을 받았습니다. 손실 보너스가 +2 증가했습니다.',
      }

    case 24: {
      const tenPercent = roundHalfToEven(state.economy.coin * 0.1)
      const amount = Math.max(1, tenPercent)
      const change = spendCoin(state, amount)

      return {
        eventId,
        title: '지옥 · 녹아내리는 코인',
        message:
          `주위 불길이 보유 코인의 약 10%를 녹였습니다. 코인 ${amount}개를 잃었습니다. ` +
          `COIN ${change.coinBefore} → ${change.coinAfter}`,
      }
    }
  }
}
