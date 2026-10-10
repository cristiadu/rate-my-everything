import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Content } from 'react-bulma-components'
import Index from '@/components/index/Index'
import OverallRankings from '@/components/rankings/OverallRankings'
import CreateUserForm from '@/components/users/CreateUserForm'
import HealthCheck from '@/components/health/HealthCheck'
import AuthPage from '@/components/users/AuthPage'
import RequireAuth from '@/components/users/RequireAuth'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminDashboard from '@/components/admin/AdminDashboard'
import UserAccount from '@/components/account/UserAccount'

import UserRole from '@/components/users/UserRole'
import type { RankingItem } from '@/components/types'

// populate with example data
const rankings: RankingItem[] = [
  {
    category: 'Electronics',
    item_name: 'iPhone 12',
    item_id: 1,
    rating: 4.5,
    item_img_url: 
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-12-blue-select-2020?' + 
      'wid=940&hei=1112&fmt=png-alpha&qlt=80&.v=1604343704000',
  },
  {
    category: 'Books',
    item_name: 'Harry Potter and the Philosopher\'s Stone',
    item_id: 2,
    rating: 4.7,
    item_img_url: 'https://images-na.ssl-images-amazon.com/images/I/51UoqRAxwEL._SX331_BO1,204,203,200_.jpg',
  },
  {
    category: 'Movies',
    item_name: 'The Shawshank Redemption',
    item_id: 3,
    rating: 4.9,
    item_img_url: 'https://upload.wikimedia.org/wikipedia/en/8/81/ShawshankRedemptionMoviePoster.jpg',
  },
  // Add more example data as needed
]

const MainContent = () => (
  <Content id="content" key="content">
    <Routes>
      <Route path="/user/create" element={<CreateUserForm />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/rankings" element={<OverallRankings rankings={rankings} />} />
      <Route path="/all_rankings" element={<OverallRankings rankings={rankings} />} />
      <Route path="/health" element={<HealthCheck />} />
      <Route path="/account" element={<RequireAuth><UserAccount /></RequireAuth>} />
      <Route path="/admin" element={<RequireAuth roles={[UserRole.ADMIN]}><AdminLayout /></RequireAuth>}>
        <Route index element={<AdminDashboard />} />
      </Route>
      <Route path="/*" element={<Index />} />
      {/* Add other routes as needed */}
    </Routes>
  </Content>
)

export default MainContent
