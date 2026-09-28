import type { EventId } from '../game/GameState'
import type {
  EventCategory,
  EventChoiceDefinition,
  EventDefinition,
  EventNumericInputDefinition,
} from './types'

interface DefinitionOptions {
  implemented?: boolean
  choiceLabel?: string
  choices?: readonly EventChoiceDefinition[]
  numericInput?: EventNumericInputDefinition
}

const numberedChoices = (
  count: number,
  label: (value: number) => string,
): readonly EventChoiceDefinition[] =>
  Array.from({ length: count }, (_, index) => {
    const value = index + 1
    return { id: String(value), label: label(value) }
  })

const definition = (
  id: EventId,
  name: string,
  category: EventCategory,
  description: string,
  options: DefinitionOptions = {},
): EventDefinition => ({
  id,
  name,
  category,
  description,
  choices:
    options.choices ??
    (options.numericInput
      ? []
      : [{ id: 'continue', label: options.choiceLabel ?? '계속' }]),
  numericInput: options.numericInput,
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
  definition(4, '도박장', 'normal', '보유 코인 안에서 자연수만큼 걸고 도박합니다.', {
    implemented: true,
    numericInput: {
      id: 'wager',
      label: '걸 코인',
      min: 1,
      maxSource: 'coin-floor',
      step: 1,
      submitLabel: '도박한다',
      fallbackChoice: { id: 'all-in-low-coin', label: '전 재산으로 도박한다' },
    },
  }),
  definition(5, '택시 아저씨', 'normal', '코인 1개를 지불하면 Stage 1~10을 즉시 이동합니다.', {
    implemented: true,
    choices: [
      { id: 'ride', label: '코인 1개를 내고 택시에 탄다' },
      { id: 'skip', label: '타지 않는다' },
    ],
  }),
  definition(6, '천사의 축복', 'normal', '다음 이동거리를 1~3 중에서 선택합니다.', {
    implemented: true,
    choices: numberedChoices(3, (value) => `다음 이동거리 ${value}`),
  }),
  definition(7, '숫자 맞추기', 'normal', '1~99 숫자를 6번 안에 맞추는 이벤트입니다.', { implemented: true, choiceLabel: '숫자 맞추기 시작' }),
  definition(8, '무언가 낙하', 'normal', '거대한 존재가 다가옵니다. 기다리거나 억지로 주사위를 굴려 도망칠 수 있습니다.', {
    implemented: true,
    choices: [
      { id: 'wait', label: '아무 행동도 하지 않는다' },
      { id: 'run', label: '주사위를 굴려 도망친다' },
    ],
  }),
  definition(9, '찬양', 'normal', '25글자의 예배문을 정확히 입력하는 이벤트입니다.', { implemented: true, choiceLabel: '예배문 받기' }),
  definition(10, '기억', 'normal', '12개의 숫자 순서를 기억하는 이벤트입니다.', { implemented: true, choiceLabel: '기억 도전 시작' }),
  definition(11, '코인뭉치', 'normal', '코인 2 + 획득 보너스를 얻습니다.', { implemented: true, choiceLabel: '결과 확인' }),
  definition(12, '코인주머니', 'normal', '코인 3 + 획득 보너스를 얻습니다.', { implemented: true, choiceLabel: '결과 확인' }),
  definition(13, '코인 털리기', 'normal', '코인 2 + 손실 보너스를 잃습니다.', { implemented: true, choiceLabel: '결과 확인' }),
  definition(14, '바람의 정령', 'normal', '다음 이동거리를 1~6 중에서 선택합니다.', {
    implemented: true,
    choices: numberedChoices(6, (value) => `다음 이동거리 ${value}`),
  }),
  definition(15, '1분 후 숫자 입력', 'normal', '60초 후 1.5초 안에 지정 숫자를 입력하는 도전을 예약합니다.', { implemented: true, choiceLabel: '시간제한 도전 예약' }),
  definition(20, '지옥 · 악마의 추격', 'hell', '악마에게서 도망치며 코인을 잃는 지옥 이벤트입니다.', { implemented: true, choiceLabel: '결과 확인' }),
  definition(21, '지옥 · 용암', 'hell', '주사위 보정이 감소하는 지옥 이벤트입니다.', { implemented: true, choiceLabel: '결과 확인' }),
  definition(22, '지옥 · 이름 모를 악마', 'hell', '잃는 코인 보정이 증가하는 지옥 이벤트입니다.', { implemented: true, choiceLabel: '결과 확인' }),
  definition(23, '지옥 · 숨어있던 악마', 'hell', '잃는 코인 보정이 크게 증가하는 지옥 이벤트입니다.', { implemented: true, choiceLabel: '결과 확인' }),
  definition(24, '지옥 · 녹아내리는 코인', 'hell', '보유 코인의 약 10%를 잃는 지옥 이벤트입니다. 현재 Stage 생성표에서는 자연 발생하지 않습니다.', { implemented: true, choiceLabel: '결과 확인' }),
  definition(49, '축복의 별', 'special', '별들의 축복과 연계되는 특별 이벤트입니다.'),
  definition(50, '악마의 거래', 'special', '획득 보너스와 손실 보너스를 함께 +1 하는 거래를 제안받습니다.', { implemented: true, choices: [ { id: 'accept', label: '거래를 받아들인다' }, { id: 'reject', label: '거래를 거절한다' } ] }),
  definition(51, '강도 습격', 'special', '코인을 지불하거나 부상을 감수해야 합니다.', { implemented: true, choices: [ { id: 'pay', label: '코인을 지불한다' }, { id: 'resist', label: '지불하지 않고 맞선다' } ] }),
  definition(52, '상점', 'special', '일반 상점을 방문하는 특별 이벤트입니다.'),
  definition(53, '성당', 'special', '현재 상태에 따라 정화·치료·천사의 깃털 효과를 받을 수 있습니다.', { implemented: true, choiceLabel: '성당을 살펴본다' }),
  definition(54, '암시장', 'special', '악세사리를 구매할 수 있는 특별 이벤트입니다.'),
  definition(55, '세금', 'special', '세금을 납부하거나 도주를 시도할 수 있습니다.', { implemented: true, choiceLabel: '세금징수원을 상대한다' }),
  definition(66, '지옥 · 고요', 'hell', '원본의 빈 sung() 슬롯을 명시적인 휴식 이벤트로 처리합니다.', { implemented: true, choiceLabel: '계속' }),
  definition(77, '777 룰렛', 'rare', '한 판에 한 번만 배치되는 희귀 룰렛 이벤트입니다.'),
]

const registry = new Map<EventId, EventDefinition>(
  definitions.map((entry) => [entry.id, entry]),
)

export const getEventDefinition = (id: EventId): EventDefinition =>
  registry.get(id) ??
  definition(id, `알 수 없는 이벤트 ${String(id)}`, 'system', '등록되지 않은 이벤트 ID입니다.')

export const isRegisteredEvent = (id: EventId): boolean => registry.has(id)
