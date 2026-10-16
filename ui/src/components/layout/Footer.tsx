import React from 'react'
import { Container, Footer } from 'react-bulma-components'

/** The app's name, shown first in the footer. */
const APP_NAME = 'Rate My Everything'

/** The one-line tagline that says how the app differs from crowd rating sites. */
const APP_TAGLINE = 'Personal ratings, not crowd scores.'

/** Where the app's source code lives. */
const REPOSITORY_URL = 'https://github.com/cristiadu/rate-my-everything'

/** Who holds the copyright on the app. */
const COPYRIGHT_HOLDER = 'Cristiano Faustino'

/** The page footer: the app's name and tagline, then the copyright and a link to the source code. */
const AppFooter = () => (
  <Footer>
    <Container className="has-text-centered">
      <p>
        <strong className="has-text-white">{APP_NAME}</strong>
        {` · ${APP_TAGLINE}`}
      </p>
      <p className="is-size-7 mt-1">
        {`© ${new Date().getFullYear()} ${COPYRIGHT_HOLDER} · `}
        <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">Source on GitHub</a>
      </p>
    </Container>
  </Footer>
)

export default AppFooter
