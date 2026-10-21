import React, { useEffect, useRef, useState } from 'react'
import { Container, Hero, Navbar } from 'react-bulma-components'
import ResizeObserver from 'resize-observer-polyfill'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import MainContent from '@/components/layout/MainContent'
import FilterMenu from '@/components/filters/FilterMenu'
import { AuthProvider } from '@/components/users/AuthContext'
import { FilterProvider } from '@/components/filters/FilterContext'

/** Bulma's desktop breakpoint: from this width up the top menu shows all its items instead of its burger. */
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'

const App = () => {
  const navbarRef = useRef(null)
  const [navbarHeight, setNavbarHeight] = useState(0)
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_MEDIA_QUERY).matches)

  /** Below the desktop breakpoint the header is too tall to stay pinned on screen, so it scrolls away with the page. */
  useEffect(() => {
    const desktopQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const updateIsDesktop = () => setIsDesktop(desktopQuery.matches)
    desktopQuery.addEventListener('change', updateIsDesktop)
    return () => desktopQuery.removeEventListener('change', updateIsDesktop)
  }, [])

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      setNavbarHeight((entries[0].target as HTMLElement).offsetHeight)
    })

    if (navbarRef.current) {
      resizeObserver.observe(navbarRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <AuthProvider>
      <FilterProvider>
        <Navbar className={isDesktop ? 'is-fixed-top' : undefined}>
          <div ref={navbarRef} style={{ width: '100%' }}>
            <Header />
          </div>
        </Navbar>
        <Hero size="fullheight" style={{ paddingTop: isDesktop ? `${navbarHeight}px` : undefined }}>
          <Hero.Body className="is-flex is-align-items-flex-start">
            <FilterMenu topOffset={navbarHeight} isHeaderPinned={isDesktop} />
            {/* Lines the page up with the header's title and keeps it from stretching across wide screens */}
            <Container breakpoint="fullhd">
              <MainContent />
            </Container>
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
