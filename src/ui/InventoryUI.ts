import type { GameState } from '../game/GameState'
import {
  getBlessingDescription,
  type BlessingId,
} from '../data/blessings'
import {
  getItemDefinition,
  ITEM_IDS,
  type ItemId,
} from '../data/items'

export type CollectionPanel = 'blessings' | 'accessories'

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const accessoryDescription = (name: string): string => {
  if (ITEM_IDS.includes(name as ItemId)) {
    return getItemDefinition(name as ItemId).description
  }

  switch (name) {
    case '천사의 깃털':
      return '기본 1~6 주사위에서 50% 확률로 최종 이동 +1'
    case '거지코인':
      return '획득 당시 손실 보너스 -1'
    case '도박사 자격증':
      return '획득 보너스 +1, 최소 획득 보너스 1'
    case '도파민 중독 자격증':
      return '획득 당시 코인 +1'
    default:
      return '특수 이벤트에서 획득한 보유 효과'
  }
}

export const renderCollectionPanel = (
  state: Readonly<GameState>,
  panel: CollectionPanel | null,
): string => {
  if (panel === null) return ''

  const isBlessing = panel === 'blessings'
  const entries = isBlessing
    ? state.blessings.owned.map((name) => ({
        name,
        description: getBlessingDescription(name as BlessingId),
      }))
    : state.inventory.ownedAccessories.map((name) => ({
        name,
        description: accessoryDescription(name),
      }))

  const title = isBlessing ? '축복' : '악세사리'
  const eyebrow = isBlessing ? 'BLESSINGS' : 'ACCESSORIES'

  const list = entries.length > 0
    ? entries
        .map(
          ({ name, description }) => `
            <li class="collection-item">
              <strong>${escapeHtml(name)}</strong>
              <p>${escapeHtml(description)}</p>
            </li>
          `,
        )
        .join('')
    : '<li class="collection-empty">아직 보유한 항목이 없습니다.</li>'

  return `
    <div class="collection-overlay" data-collection-close>
      <section
        class="collection-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="${title}"
        data-collection-sheet
      >
        <div class="collection-sheet__heading">
          <div>
            <span>${eyebrow}</span>
            <h2>${title} · ${entries.length}</h2>
          </div>
          <button
            type="button"
            aria-label="${title} 닫기"
            data-collection-close
          >×</button>
        </div>
        <ul class="collection-list">
          ${list}
        </ul>
      </section>
    </div>
  `
}
