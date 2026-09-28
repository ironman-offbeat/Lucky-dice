import type { GameState } from '../game/GameState'
import { getBlessingDescription, type BlessingId } from '../data/blessings'
import { getShopPrice } from '../game/ShopEngine'
import type { EventChoiceDefinition, EventDefinition } from './types'

export const presentEventDefinition = (
  state: Readonly<GameState>,
  definition: Readonly<EventDefinition>,
): EventDefinition => {
  if (definition.id === 'blessing') {
    const offers = state.event.blessingOffers as BlessingId[]

    if (offers.length === 0) {
      return {
        ...definition,
        choices: [
          { id: 'continue-blessing', label: '계속' },
        ],
      }
    }

    return {
      ...definition,
      description:
        '세 가지 축복 중 하나를 받거나 축복을 거절할 수 있습니다. 획득한 축복은 이번 판에 다시 등장하지 않습니다.',
      choices: [
        ...offers.map((id) => ({
          id: `blessing:${id}`,
          label: `${id} · ${getBlessingDescription(id)}`,
        })),
        {
          id: 'reject-blessing',
          label: '축복을 거절한다 · 획득 -1 / 손실 +1',
        },
      ],
    }
  }

  if (definition.id === 'fame') {
    return {
      ...definition,
      description:
        `명성의 축복으로 남은 확정 이벤트 ${state.blessings.fameEventsRemaining}회. 원하는 후원을 선택하세요.`,
      choices: [
        { id: 'fame-dice', label: '상인의 후원 · 주사위 보정 +1' },
        { id: 'fame-loss', label: '시민의 축복 · 손실 보너스 -1' },
        { id: 'fame-gain', label: '시인의 이야기 · 획득 보너스 +1' },
      ],
    }
  }

  if (definition.id === 49) {
    const offers = state.event.blessingOffers as BlessingId[]

    if (state.progress.stage > 300 || offers.length === 0) {
      return {
        ...definition,
        description:
          '추락한 별을 발견했지만 별 안의 축복은 남아 있지 않습니다.',
        choices: [
          { id: 'continue-star', label: '별을 지나친다' },
        ],
      }
    }

    const id = offers[0]

    return {
      ...definition,
      description:
        '추락한 별 안에서 하나의 축복이 빛나고 있습니다.',
      choices: [
        {
          id: `blessing:${id}`,
          label: `${id} · ${getBlessingDescription(id)}`,
        },
        { id: 'ignore-star', label: '별을 무시한다' },
      ],
    }
  }

  if (definition.id === 52) {
    const choices: EventChoiceDefinition[] = [
      {
        id: 'buy-dice',
        label: `주사위 보정 +1 · ${getShopPrice(state, 'dice')}코인`,
      },
      {
        id: 'buy-gain',
        label: `획득 보너스 +0.5 · ${getShopPrice(state, 'gain')}코인`,
      },
    ]

    if (state.blessings.owned.includes('J의 축복')) {
      choices.push({
        id: 'buy-lottery',
        label: `J의 복권 · ${getShopPrice(state, 'lottery')}코인`,
      })
    }

    choices.push({
      id: 'leave',
      label: '아무것도 사지 않고 나간다',
    })

    return {
      ...definition,
      description:
        '상점 주인이 여정 지원금으로 코인을 건넸습니다. 상품은 하나만 구매할 수 있습니다.',
      choices,
    }
  }

  if (definition.id === 53) {
    if (state.inventory.ownedAccessories.includes('천사의 깃털')) {
      return {
        ...definition,
        description:
          '천사의 깃털이 성당의 신성함에 반응해 강한 빛을 냅니다.',
        choices: [
          { id: 'feather', label: '천사의 깃털의 빛을 따른다' },
        ],
      }
    }

    const choices: EventChoiceDefinition[] = []

    if (state.economy.coinLossBonus > 0) {
      choices.push({
        id: 'purify',
        label: '정화를 받는다 · 손실 보너스 -1',
      })
    }

    if (state.dice.modifier < 0) {
      choices.push({
        id: 'heal',
        label: '치료를 받는다 · 주사위 보정 +1',
      })
    }

    choices.push({
      id: 'leave',
      label: '아무것도 받지 않고 나간다 · 코인 획득',
    })

    return {
      ...definition,
      description:
        '성직자가 당신의 상태를 살피고 가능한 도움을 제안합니다.',
      choices,
    }
  }

  if (definition.id === 55) {
    if (state.blessings.owned.includes('명성의 축복')) {
      return {
        ...definition,
        description:
          '세금징수원이 당신의 명성을 알아본 듯합니다.',
        choices: [
          { id: 'exempt', label: '명성에 따른 면제를 받는다' },
        ],
      }
    }

    return {
      ...definition,
      choices: [
        { id: 'pay', label: '정직하게 세금을 납부한다' },
        { id: 'flee', label: '세금징수원에게서 도망친다' },
      ],
    }
  }

  return { ...definition }
}
