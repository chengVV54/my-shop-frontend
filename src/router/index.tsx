import type { FC } from 'react'
import { Route, Routes } from 'react-router-dom'

import Home from '@/pages/Home'
import ProductList from '@/pages/ProductList'

const AppRouter: FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<ProductList />} />
    </Routes>
  )
}

export default AppRouter
