import type { FC } from 'react'
import { Route, Routes } from 'react-router-dom'

import Layout from '@/components/Layout'
import Barter from '@/pages/Barter'
import BarterApply from '@/pages/BarterApply'
import BarterDetail from '@/pages/BarterDetail'
import Barters from '@/pages/Barters'
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
        {/* 发起换物：用「我的在架物品」换 /items/:itemId 这件物品（需登录） */}
        <Route path="/barter/apply/:itemId" element={<BarterApply />} />
        {/* 我的换物：我发起 / 我收到的换物申请（需登录） */}
        <Route path="/barters" element={<Barters />} />
        {/* 换物详情：下一步接入详情数据，当前为占位页 */}
        <Route path="/barters/:id" element={<BarterDetail />} />
        <Route path="/second-hand" element={<SecondHand />} />
        <Route path="/publish" element={<PublishItem />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/profile" element={<Profile />} />
        {/* 登录 / 注册：与主站共用 Layout，登录后回到首页 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
    </Routes>
  )
}

export default AppRouter
