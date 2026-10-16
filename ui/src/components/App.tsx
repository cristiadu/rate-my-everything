import React, { useEffect, useRef, useState } from 'react'
import { Columns, Hero, Navbar } from 'react-bulma-components'
import ResizeObserver from 'resize-observer-polyfill'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import MainContent from '@/components/layout/MainContent'
import FilterMenu from '@/components/filters/FilterMenu'
import { AuthProvider } from '@/components/users/AuthContext'
import { FilterProvider } from '@/components/filters/FilterContext'

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
    <AuthProvider>
      <FilterProvider>
        <Navbar className="is-fixed-top">
          <div ref={navbarRef} style={{ width: '100%' }}>
            <Header />
          </div>
        </Navbar>
        <Hero size="fullheight" style={{ paddingTop: `${navbarHeight}px` }}>
          <Hero.Body className="is-flex is-align-items-flex-start">
            <FilterMenu topOffset={navbarHeight} />
            <Columns.Column size={10}>
              <MainContent />
            </Columns.Column>
          </Hero.Body>
          <Hero.Footer renderAs="footer">
            <Footer />
          </Hero.Footer>
        </Hero>
      </FilterProvider>
    </AuthProvider>
  )
}
export default App
