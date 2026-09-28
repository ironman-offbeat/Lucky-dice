export const BLESSING_CATALOG = {
  '복리의 축복': '코인을 획득할 때마다 앞으로 얻는 코인이 0.2 상승합니다.',
  '탐욕의 축복': '999코인을 즉시 획득하지만 손실 보너스가 100 상승합니다.',
  '회귀의 축복': '현재 상태를 유지한 채 Stage 0으로 이동합니다.',
  'J의 축복': '현재 코인이 50% 증가합니다.',
  '주사위의 축복': '한 번 사용할 수 있는 1~50 선택 주사위를 획득합니다.',
  '안개의 축복': '주사위 감소 효과와 손실 보너스를 최대 10만큼 정화합니다.',
  '별들의 축복': '특별 이벤트에 축복의 별 이벤트가 추가됩니다.',
  '명성의 축복': '앞으로 3번의 이벤트가 유명한 자의 길로 확정됩니다.',
  '신속의 축복': '현재 상태를 유지한 채 Stage 300으로 이동합니다.',
} as const

export type BlessingId = keyof typeof BLESSING_CATALOG

export const BLESSING_IDS = Object.freeze(
  Object.keys(BLESSING_CATALOG) as BlessingId[],
)

export const getBlessingDescription = (
  id: BlessingId,
): string => BLESSING_CATALOG[id]
