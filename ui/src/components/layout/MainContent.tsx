import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Content } from 'react-bulma-components'
import Index from '@/components/index/Index'
import OverallRankings from '@/components/rankings/OverallRankings'
import RequireAdmin, { RequireLogin, RequireModerator } from '@/components/admin/RequireAdmin'
import AdminDashboard from '@/components/admin/AdminDashboard'
import UserManagement from '@/components/admin/users/UserManagement'
import CreateUserForm from '@/components/users/CreateUserForm'
import HealthCheck from '@/components/health/HealthCheck'
import UserAccount from '@/components/account/UserAccount'
import CategoriesPage from '@/components/categories/CategoriesPage'
import AttributeManagement from '@/components/admin/attributes/AttributeManagement'
import InterestFormPage from '@/components/interests/InterestFormPage'
import ModerationPage from '@/components/moderation/ModerationPage'
import MyChangeRequestsPage from '@/components/moderation/MyChangeRequestsPage'
import { RankingScope } from '@/components/types'

const MainContent = () => (
  <Content id="content" key="content">
    <Router>
      <Routes>
        <Route path="/account" element={<RequireLogin><UserAccount /></RequireLogin>} />
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/users" element={<RequireAdmin><UserManagement /></RequireAdmin>} />
        <Route path="/admin/attributes" element={<RequireAdmin><AttributeManagement /></RequireAdmin>} />
        <Route path="/user/create" element={<RequireAdmin><CreateUserForm /></RequireAdmin>} />
        <Route path="/rankings" element={<RequireLogin><OverallRankings scope={RankingScope.MINE} /></RequireLogin>} />
        <Route path="/all_rankings" element={<RequireLogin><OverallRankings scope={RankingScope.ALL} /></RequireLogin>} />
        <Route path="/interests/new" element={<RequireLogin><InterestFormPage /></RequireLogin>} />
        <Route path="/interests/:itemId/edit" element={<RequireLogin><InterestFormPage /></RequireLogin>} />
        <Route path="/categories" element={<RequireLogin><CategoriesPage /></RequireLogin>} />
        <Route path="/change-requests" element={<RequireLogin><MyChangeRequestsPage /></RequireLogin>} />
        <Route path="/moderation" element={<RequireModerator><ModerationPage /></RequireModerator>} />
        <Route path="/health" element={<HealthCheck />} />
        <Route path="/*" element={<Index />} />
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  </Content>
)

export default MainContent
