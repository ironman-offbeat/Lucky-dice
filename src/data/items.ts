export const ITEM_CATALOG = {
  '하급악마계약서': {
    price: 0,
    description: '획득 보너스 +1 / 손실 보너스 +1',
  },
  '중급악마계약서': {
    price: 0,
    description: '코인 +10 / 손실 보너스 +1 / 주사위 보정 -1',
  },
  '상급악마계약서': {
    price: 0,
    description: '코인 +15 / 손실 보너스 +2 / 주사위 보정 -1',
  },
  '주사위저금통': {
    price: 10,
    description: '일반 주사위를 굴릴 때마다 코인 +0.5',
  },
  '붕대': {
    price: 4,
    description: '주사위 보정 +1',
  },
  '균형의수호자': {
    price: 4,
    description: '이벤트 정산 시 소수 코인을 올림',
  },
  '칭찬스티커': {
    price: 3,
    description: '손실 보너스 -1',
  },
  '마왕계약서': {
    price: 0,
    description: '코인 +30 / 손실 보너스 +10 / 획득 보너스 +5',
  },
  'D의 환생서': {
    price: 5,
    description: '25% 사망 / 25% 획득 보너스 -1 / 50% 손실 보너스 0 및 획득 보너스 +5',
  },
  '시간의 모래시계': {
    price: 10,
    description: 'Stage -50',
  },
  '메모리세이버': {
    price: 3,
    description: '세이브 기능 아이템',
  },
  '무신론': {
    price: 0,
    description: '획득 보너스 +5 / 손실 보너스 -5 / 축복 차단 및 보유 축복 수 기반 저주',
  },
  '어둠의 주사위': {
    price: 5,
    description: '주사위 눈을 -2, -1, 2, 3, 5, 8로 변경',
  },
  '역행성': {
    price: 15,
    description: 'Stage 0 / 획득 보너스 0',
  },
} as const

export type ItemId = keyof typeof ITEM_CATALOG

export interface ItemDefinition {
  id: ItemId
  price: number
  description: string
  oneTime: true
}

export const ITEM_IDS = Object.freeze(
  Object.keys(ITEM_CATALOG) as ItemId[],
)

export const getItemDefinition = (
  id: ItemId,
): ItemDefinition => ({
  id,
  price: ITEM_CATALOG[id].price,
  description: ITEM_CATALOG[id].description,
  oneTime: true,
})
