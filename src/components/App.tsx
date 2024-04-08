import React from 'react'
import { Columns, Hero } from 'react-bulma-components'
import Header from './layout/Header'
import Footer from './layout/Footer'
import MainContent from './layout/MainContent'
import FilterMenu from './filters/FilterMenu'

const App = () => (
  <Hero size="fullheight">
    <Hero.Header renderAs="header">
      <Header />
    </Hero.Header>
    <Hero.Body alignItems="flex-start" className="is-relative" paddingless>
      <Columns.Column size={2} paddingless overlay>
        <FilterMenu />
      </Columns.Column>
      <Columns.Column size={10} offset={1}>
        <MainContent />
      </Columns.Column>
    </Hero.Body>
    <Hero.Footer renderAs="footer">
      <Footer />
    </Hero.Footer>
  </Hero>
)

export default App
