import type { FC } from 'react'

import ModeItemList from '@/components/ModeItemList'
import type { ItemMode } from '@/types'

/** 换物入口：包含纯换物与「都可」的物品 */
const BARTER_MODES: ItemMode[] = ['BARTER', 'BOTH']

/**
 * 换物页。
 *
 * 展示所有支持换物的物品（`BARTER` / `BOTH`），过滤与网格由
 * `ModeItemList` 复用实现。
 */
const Barter: FC = () => {
  return (
    <ModeItemList
      title="换物"
      subtitle="以物换物，不花钱"
      modes={BARTER_MODES}
      emptyText="暂无换物"
    />
  )
}

export default Barter
