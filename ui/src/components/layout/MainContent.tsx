import React from 'react'
import {
  BrowserRouter as Router, Navigate, Routes, Route,
} from 'react-router-dom'
import { Content } from 'react-bulma-components'
import Index from '@/components/index/Index'
import OverallRankings from '@/components/rankings/OverallRankings'
import RequireAdmin from '@/components/admin/RequireAdmin'
import UserManagement from '@/components/admin/users/UserManagement'
import HealthCheck from '@/components/health/HealthCheck'
import CategoriesPage from '@/components/categories/CategoriesPage'
import AttributeManagement from '@/components/admin/attributes/AttributeManagement'
import InterestFormPage from '@/components/interests/InterestFormPage'
import { withAuth } from '@/components/users/AuthContext'
import { RankingScope } from '@/components/types'

const ProtectedCategoriesPage = withAuth(CategoriesPage)
const ProtectedRankings = withAuth(OverallRankings)
const ProtectedInterestFormPage = withAuth(InterestFormPage)

const MainContent = () => (
  <Content id="content" key="content">
    <Router>
      <Routes>
        <Route path="/admin/users" element={<RequireAdmin><UserManagement /></RequireAdmin>} />
        <Route path="/admin/attributes" element={<RequireAdmin><AttributeManagement /></RequireAdmin>} />
        <Route path="/user/create" element={<Navigate to="/admin/users" replace />} />
        <Route path="/rankings" element={<ProtectedRankings scope={RankingScope.MINE} />} />
        <Route path="/all_rankings" element={<ProtectedRankings scope={RankingScope.ALL} />} />
        <Route path="/interests/new" element={<ProtectedInterestFormPage />} />
        <Route path="/interests/:itemId/edit" element={<ProtectedInterestFormPage />} />
        <Route path="/categories" element={<ProtectedCategoriesPage />} />
        <Route path="/health" element={<HealthCheck />} />
        <Route path="/*" element={<Index />} />
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  </Content>
)

export default MainContent
