import type { FC } from 'react'
import { Route, Routes } from 'react-router-dom'

import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import ItemDetail from '@/pages/ItemDetail'
import ItemList from '@/pages/ItemList'
import PublishItem from '@/pages/PublishItem'

const AppRouter: FC = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/items" element={<ItemList />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/publish" element={<PublishItem />} />
      </Route>
    </Routes>
  )
}

export default AppRouter
