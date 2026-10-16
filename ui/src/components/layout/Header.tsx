import React from 'react'
import {
  Container, Heading, Hero,
} from 'react-bulma-components'
import HeaderMenu from '@/components/layout/HeaderMenu'
import UserHeaderMenu from '@/components/users/UserHeaderMenu'

/** The app's name, shown as the header's title and in the footer. */
export const APP_NAME = 'Rate My Everything'

/** The app's tagline, shown under the header's title and in the footer. */
export const APP_TAGLINE = 'When you change your mind a lot and need to keep track of it.'

const Header = () => (
  <Hero color="danger" size="small" style={{ width: '100%' }}>
    <Hero.Header>
      <UserHeaderMenu />
    </Hero.Header>
    <Hero.Body className="has-background-danger-light">
      <Container>
        <Heading textColor="danger">
          {APP_NAME}
        </Heading>
        <Heading
          size={5}
          subtitle
          textColor="dark"
        >
          {APP_TAGLINE}
        </Heading>
      </Container>
    </Hero.Body>
    <Hero.Footer>
      <HeaderMenu />
    </Hero.Footer>
  </Hero>
)

export default Header
