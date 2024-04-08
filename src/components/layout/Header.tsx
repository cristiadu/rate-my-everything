import React from 'react'
import {
  Container, Heading, Hero,
} from 'react-bulma-components'
import HeaderMenu from './HeaderMenu'
import UserHeaderMenu from '../users/UserHeaderMenu'

const Header = () => (
  <Hero color="danger" size="small" style={{ width: '100%' }}>
    <Hero.Header>
      <UserHeaderMenu />
    </Hero.Header>
    <Hero.Body className="has-background-danger-light">
      <Container>
        <Heading textColor="danger">
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
