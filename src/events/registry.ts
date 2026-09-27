import type { EventId } from '../game/GameState'
import type {
  EventCategory,
  EventChoiceDefinition,
  EventDefinition,
} from './types'

const definition = (
  id: EventId,
  name: string,
  category: EventCategory,
  description: string,
  options: {
    implemented?: boolean
    choiceLabel?: string
  } = {},
): EventDefinition => ({
  id,
  name,
  category,
  description,
  choices: [
    {
      id: 'continue',
      label: options.choiceLabel ?? '계속',
    },
  ],
  implemented: options.implemented ?? false,
})

const definitions: readonly EventDefinition[] = [
  definition('fame', '유명한 자의 길', 'system', '명성의 축복으로 우선 발생하는 이벤트입니다.'),
  definition('blessing', '축복 이벤트', 'system', '100 Stage 단위로 우선 발생하는 축복 이벤트입니다.'),
  definition('hidden-zero', '되돌아온 길', 'hidden', 'Stage 0 이하에서 발생하는 히든 이벤트입니다.'),
  definition(-1, '첫 번째 히든 이벤트', 'hidden', 'Stage 1에 배치된 원본 히든 이벤트입니다.'),
  definition(0, '쉬어가기', 'system', '별도의 사건 없이 다음 여정을 준비합니다.'),
  definition(1, '맞장뜨기', 'normal', '50% 확률로 코인을 얻거나 잃습니다.', { implemented: true, choiceLabel: '싸운다' }),
  definition(2, '삥 뜯기기', 'normal', '길에서 코인을 빼앗깁니다.', { implemented: true, choiceLabel: '결과 확인' }),
  definition(3, '코인 줍기', 'normal', '길에서 코인을 발견합니다.', { implemented: true, choiceLabel: '결과 확인' }),
  definition(4, '도박장', 'normal', '보유 코인을 걸고 결과를 확인하는 도박 이벤트입니다.'),
  definition(5, '택시 아저씨', 'normal', '코인을 지불하고 Stage를 추가 이동하는 이벤트입니다.'),
  definition(6, '천사의 축복', 'normal', '천사와 관련된 선택 이벤트입니다.'),
  definition(7, '숫자 맞추기', 'normal', '1~99 숫자를 제한 횟수 안에 맞추는 이벤트입니다.'),
  definition(8, '무언가 낙하', 'normal', '거대한 존재와 마주치는 이벤트입니다.'),
  definition(9, '찬양', 'normal', '입력형 찬양 이벤트입니다.'),
  definition(10, '기억', 'normal', '기억력을 사용하는 입력 이벤트입니다.'),
  definition(11, '코인뭉치', 'normal', '코인 2 + 획득 보너스를 얻습니다.', { implemented: true, choiceLabel: '결과 확인' }),
  definition(12, '코인주머니', 'normal', '코인 3 + 획득 보너스를 얻습니다.', { implemented: true, choiceLabel: '결과 확인' }),
  definition(13, '코인 털리기', 'normal', '코인 2 + 손실 보너스를 잃습니다.', { implemented: true, choiceLabel: '결과 확인' }),
  definition(14, '바람의 정령', 'normal', '바람의 정령과 관련된 이벤트입니다.'),
  definition(15, '1분 후 숫자 입력', 'normal', '예약된 시간 뒤 짧은 입력을 요구하는 이벤트입니다.'),
  definition(20, '지옥 · 악마의 추격', 'hell', '악마에게서 도망치며 코인을 잃는 지옥 이벤트입니다.'),
  definition(21, '지옥 · 용암', 'hell', '주사위 보정이 감소하는 지옥 이벤트입니다.'),
  definition(22, '지옥 · 이름 모를 악마', 'hell', '잃는 코인 보정이 증가하는 지옥 이벤트입니다.'),
  definition(23, '지옥 · 숨어있던 악마', 'hell', '잃는 코인 보정이 크게 증가하는 지옥 이벤트입니다.'),
  definition(24, '지옥 이벤트 3', 'hell', '원본에는 구현되어 있으나 현재 Stage 생성표에서는 나오지 않는 지옥 이벤트입니다.'),
  definition(49, '축복의 별', 'special', '별들의 축복과 연계되는 특별 이벤트입니다.'),
  definition(50, '악마의 거래', 'special', '악마와 거래하는 특별 이벤트입니다.'),
  definition(51, '강도 습격', 'special', '강도를 만나는 특별 이벤트입니다.'),
  definition(52, '상점', 'special', '일반 상점을 방문하는 특별 이벤트입니다.'),
  definition(53, '성당', 'special', '성당을 방문하는 특별 이벤트입니다.'),
  definition(54, '암시장', 'special', '악세사리를 구매할 수 있는 특별 이벤트입니다.'),
  definition(55, '세금', 'special', '조세와 관련된 특별 이벤트입니다.'),
  definition(66, '지옥 특별 이벤트', 'hell', '원본에서 sung()이 비어 있는 지옥 특별 이벤트 슬롯입니다.'),
  definition(77, '777 룰렛', 'rare', '한 판에 한 번만 배치되는 희귀 룰렛 이벤트입니다.'),
]

const registry = new Map<EventId, EventDefinition>(
  definitions.map((entry) => [entry.id, entry]),
)

export const getEventDefinition = (id: EventId): EventDefinition =>
  registry.get(id) ??
  definition(id, `알 수 없는 이벤트 ${String(id)}`, 'system', '등록되지 않은 이벤트 ID입니다.')

export const isRegisteredEvent = (id: EventId): boolean => registry.has(id)
