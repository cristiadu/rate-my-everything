import React from 'react'
import { Container, Footer } from 'react-bulma-components'
import { APP_NAME, APP_TAGLINE } from '@/components/layout/Header'

/** Where the app's source code lives. */
const REPOSITORY_URL = 'https://github.com/cristiadu/rate-my-everything'

/** Who holds the copyright on the app. */
const COPYRIGHT_HOLDER = 'Cristiano Faustino'

/** The page footer: the app's name and the header's tagline, then the copyright and a link to the source code. */
const AppFooter = () => (
  <Footer>
    <Container className="has-text-centered">
      <p className="is-size-4 is-size-6-mobile">
        <strong className="has-text-white">{APP_NAME}</strong>
        {` · ${APP_TAGLINE}`}
      </p>
      <p className="is-size-5 is-size-7-mobile mt-3">
        {`© ${new Date().getFullYear()} ${COPYRIGHT_HOLDER} · `}
        <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">Source on GitHub</a>
      </p>
    </Container>
  </Footer>
)

export default AppFooter
