import React from 'react'
import {
  BrowserRouter as Router, Navigate, Routes, Route,
} from 'react-router-dom'
import { Content } from 'react-bulma-components'
import Index from '@/components/index/Index'
import OverallRankings from '@/components/rankings/OverallRankings'
import RequireAdmin, { RequireLogin } from '@/components/admin/RequireAdmin'
import AdminDashboard from '@/components/admin/AdminDashboard'
import UserManagement from '@/components/admin/users/UserManagement'
import HealthCheck from '@/components/health/HealthCheck'
import UserAccount from '@/components/account/UserAccount'

import { RankingItem } from '../types'

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
    <Router>
      <Routes>
        <Route path="/account" element={<RequireLogin><UserAccount /></RequireLogin>} />
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/users" element={<RequireAdmin><UserManagement /></RequireAdmin>} />
        <Route path="/user/create" element={<Navigate to="/admin/users" replace />} />
        <Route path="/rankings" element={<OverallRankings rankings={rankings} />} />
        <Route path="/all_rankings" element={<OverallRankings rankings={rankings} />} />
        <Route path="/health" element={<HealthCheck />} />
        <Route path="/*" element={<Index />} />
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  </Content>
)

export default MainContent
