import type { FC } from 'react'

import ModeItemList from '@/components/ModeItemList'
import type { ItemMode } from '@/types'

/** 二手入口：包含纯二手与「都可」的物品 */
const SECOND_HAND_MODES: ItemMode[] = ['SALE', 'BOTH']

/**
 * 二手页。
 *
 * 展示所有支持二手购买的物品（`SALE` / `BOTH`），过滤与网格由
 * `ModeItemList` 复用实现。
 */
const SecondHand: FC = () => {
  return (
    <ModeItemList
      title="二手"
      subtitle="闲置变现，低价好物"
      modes={SECOND_HAND_MODES}
      emptyText="暂无二手"
    />
  )
}

export default SecondHand
