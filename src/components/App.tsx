import React from 'react'
import { Hero } from 'react-bulma-components'
import Header from './page-layout/Header'
import Main from './page-layout/Main'
import Footer from './page-layout/Footer'

export default () => (
  <Hero size="fullheight">
    <Hero.Header renderAs="header">
      <Header />
    </Hero.Header>
    <Hero.Body paddingless>
      <Main />
    </Hero.Body>
    <Hero.Footer renderAs="footer">
      <Footer />
    </Hero.Footer>
  </Hero>
)
