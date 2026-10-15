import React from 'react'
import {
  Container, Heading, Hero,
} from 'react-bulma-components'
import HeaderMenu from '@/components/layout/HeaderMenu'
import UserHeaderMenu from '@/components/users/UserHeaderMenu'

const Header = () => (
  <Hero color="primary" size="small" style={{ width: '100%' }}>
    <Hero.Header>
      <UserHeaderMenu />
    </Hero.Header>
    <Hero.Body className="has-background-primary-light">
      <Container>
        <Heading textColor="primary-dark">
          Rate My Everything
        </Heading>
        <Heading
          size={5}
          subtitle
          textColor="dark"
        >
          When you change your mind a lot and need to keep track of it.
        </Heading>
      </Container>
    </Hero.Body>
    <Hero.Footer>
      <HeaderMenu />
    </Hero.Footer>
  </Hero>
)

export default Header
