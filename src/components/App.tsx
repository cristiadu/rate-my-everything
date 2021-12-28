import React from 'react'
import { Columns, Hero } from 'react-bulma-components'
import Header from './layout/Header'
import Footer from './layout/Footer'
import MainContent from './layout/MainContent'
import FilterMenu from './filters/FilterMenu'

export default () => (
  <Hero size="fullheight">
    <Hero.Header renderAs="header">
      <Header />
    </Hero.Header>
    <Hero.Body alignItems="flex-start" className="is-relative" paddingless>
      <Columns.Column backgroundColor="info" size={1} paddingless overlay>
        <FilterMenu />
      </Columns.Column>
      <Columns.Column backgroundColor="dark" size={11} offset={1}>
        <MainContent />
      </Columns.Column>
    </Hero.Body>
    <Hero.Footer renderAs="footer">
      <Footer />
    </Hero.Footer>
  </Hero>
)
