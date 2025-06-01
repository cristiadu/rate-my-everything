import React, { useEffect, useRef, useState } from 'react'
import { Columns, Hero, Navbar } from 'react-bulma-components'
import ResizeObserver from 'resize-observer-polyfill'
import Header from '@/components/layout/Header'
import Footer from '../../../../../layout/Footer'
import MainContent from '../../../../../layout/MainContent'
import FilterMenu from './filters/FilterMenu'

const App = () => {
  const navbarRef = useRef(null)
  const [navbarHeight, setNavbarHeight] = useState(0)

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      setNavbarHeight((entries[0].target as HTMLElement).offsetHeight)
    })

    if (navbarRef.current) {
      resizeObserver.observe(navbarRef.current)
    }

    return () => {
      if (navbarRef.current) {
        resizeObserver.unobserve(navbarRef.current)
      }
    }
  }, [])

  return (
    <>
      <Navbar className="is-fixed-top">
        <div ref={navbarRef} style={{ width: '100%' }}>
          <Header />
        </div>
      </Navbar>
      <Hero size="fullheight" style={{ paddingTop: `${navbarHeight}px` }}>
        <Hero.Body className="is-flex is-align-items-flex-start">
          <Columns.Column size={2} overlay style={{ marginTop: `${navbarHeight}px` }}>
            <FilterMenu />
          </Columns.Column>
          <Columns.Column size={10}>
            <MainContent />
          </Columns.Column>
        </Hero.Body>
        <Hero.Footer renderAs="footer">
          <Footer />
        </Hero.Footer>
      </Hero>
    </>
  )
}
export default App
