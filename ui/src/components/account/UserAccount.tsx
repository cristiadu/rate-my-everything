import React from 'react'
import { Box, Heading, Tag } from 'react-bulma-components'
import { useAuth } from '@/components/users/AuthContext'

/** The signed-in user's own area. */
const UserAccount: React.FC = () => {
  const { user } = useAuth()

  return (
    <Box>
      <Heading size={4} renderAs="h2">My Account</Heading>
      <p>Username: {user?.username}</p>
      <div>
        Roles: {user?.roles.map((role) => <Tag key={role} mr={1}>{role}</Tag>)}
      </div>
    </Box>
  )
}

export default UserAccount
