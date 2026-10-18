import React from 'react'
import { Box, Heading, Tag } from 'react-bulma-components'
import { useAuth } from '@/components/users/AuthContext'
import { getRolesFromToken, getUsernameFromToken } from '@/components/admin/RequireAdmin'

/** The logged-in user's own area. */
const UserAccount: React.FC = () => {
  const { token } = useAuth()

  return (
    <Box className="form-box">
      <Heading size={4} renderAs="h2">My Account</Heading>
      <p>Username: {getUsernameFromToken(token)}</p>
      <div>
        Roles: {getRolesFromToken(token).map((role) => <Tag key={role} mr={1}>{role}</Tag>)}
      </div>
    </Box>
  )
}

export default UserAccount
