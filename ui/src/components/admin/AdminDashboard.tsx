import React from 'react'
import { Box, Heading } from 'react-bulma-components'
import { useAuth } from '@/components/users/AuthContext'
import { getUsernameFromToken } from '@/components/admin/RequireAdmin'

/** Landing page of the admin area. */
const AdminDashboard: React.FC = () => {
  const { token } = useAuth()

  return (
    <Box>
      <Heading size={4} renderAs="h2">Admin Area</Heading>
      <p>Signed in as {getUsernameFromToken(token)}.</p>
      <p>
        This area is only visible to administrators. Manage accounts from the <a href="/admin/users">Users</a> page.
      </p>
    </Box>
  )
}

export default AdminDashboard
