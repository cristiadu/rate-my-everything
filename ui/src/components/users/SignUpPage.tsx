import React from 'react'
import { Box, Heading } from 'react-bulma-components'
import CreateUserForm from '@/components/users/CreateUserForm'

/** Page where a visitor creates their own account with the user form in sign-up mode. */
const SignUpPage: React.FC = () => (
  <Box>
    <Heading size={4} renderAs="h2">Create your account</Heading>
    <CreateUserForm isSignUp />
  </Box>
)

export default SignUpPage
