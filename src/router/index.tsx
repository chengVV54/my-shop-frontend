import type { FC } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from '@/components/Layout'
import Barter from '@/pages/Barter'
import Home from '@/pages/Home'
import ItemDetail from '@/pages/ItemDetail'
import ItemList from '@/pages/ItemList'
import Login from '@/pages/Login'
import Messages from '@/pages/Messages'
import Profile from '@/pages/Profile'
import PublishItem from '@/pages/PublishItem'
import Register from '@/pages/Register'
import SecondHand from '@/pages/SecondHand'
import Videos from '@/pages/Videos'

const AppRouter: FC = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/items" element={<ItemList />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/barter" element={<Barter />} />
        <Route path="/second-hand" element={<SecondHand />} />
        <Route path="/publish" element={<PublishItem />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/profile" element={<Profile />} />
        {/* 登录 / 注册：与主站共用 Layout，登录后回到首页 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/*
          「我的换物」独立页面尚未开发（见 docs/PROGRESS.md 待做），
          先重定向到「我的」页，避免下拉菜单跳转后白屏。
        */}
        <Route path="/barters" element={<Navigate to="/profile" replace />} />
      </Route>
    </Routes>
  )
}

export default AppRouter
