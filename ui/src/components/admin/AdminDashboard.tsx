import React from 'react'
import { Link } from 'react-router-dom'
import { Box, Heading } from 'react-bulma-components'
import { useAuth } from '@/components/users/AuthContext'

/** Landing page of the admin area. */
const AdminDashboard: React.FC = () => {
  const { user } = useAuth()

  return (
    <Box>
      <Heading size={5} subtitle renderAs="h3">
        Signed in as {user?.username}
      </Heading>
      <p>
        This area is only visible to administrators. Manage accounts from the <Link to="/admin/users">Users</Link> page.
      </p>
    </Box>
  )
}

export default AdminDashboard
