import React from 'react'
import { Box, Columns, Heading } from 'react-bulma-components'
import { useAuth } from '@/components/users/AuthContext'
import { SIGN_UP_PATH } from '@/components/users/UserHeaderMenu'
import { GradeBox } from '@/components/interests/ItemGrades'
import { MAX_RATING, MIN_RATING } from '@/components/interests/interestForm'
import { AVERAGE_GRADE, GOOD_GRADE } from '@/components/rankings/rankingData'
import type { HomeFeature } from '@/components/types'

/** What the app does, in the order the home page lists it. */
const FEATURES: HomeFeature[] = [
  {
    title: 'Rate anything',
    description: 'Movies, music, books, games, restaurants or anything else. Each category has its own fields, '
      + 'like a book\'s author or a restaurant\'s city, and you can import favorites from Last.fm and YouTube.',
  },
  {
    title: 'Change your mind',
    description: 'Rate the same thing again whenever your opinion changes. Your history keeps every grade, '
      + 'and only your latest one counts toward the overall grade.',
  },
  {
    title: 'Compare with everyone',
    description: 'Every interest shows your grade next to everyone else\'s, the full history of how it was rated '
      + 'and its own discussion.',
  },
]

/** Example grades for the home page, one per grade color, each with the range that color covers. */
const SAMPLE_GRADES = [
  { label: 'Loved it', grade: 8.5, detail: `${GOOD_GRADE} and up` },
  { label: 'It was fine', grade: 5.5, detail: `${AVERAGE_GRADE} to ${GOOD_GRADE}` },
  { label: 'Not for me', grade: 2, detail: `below ${AVERAGE_GRADE}` },
]

/**
 * Home page: says what the app is and how grading works, so visitors don't land on an empty page.
 * Visitors are pointed to the sign-up page and the header's login; signed-in users get links to their interests.
 */
const Index = () => {
  const { isAuthenticated } = useAuth()

  return (
    <Box>
      <Heading size={4} renderAs="h2" textColor="primary" className="is-size-5-mobile">
        Keep track of everything you love, and how your taste changes.
      </Heading>
      <p className="is-size-6">
        {`Give anything a grade from ${MIN_RATING} to ${MAX_RATING}, rate it again when you change your mind, `
          + 'and see how your opinion compares with everyone else\'s.'}
      </p>
      {isAuthenticated ? (
        <div className="buttons">
          <a className="button is-primary" href="/rankings">My interests</a>
          <a className="button is-light" href="/interests/new">Add an interest</a>
        </div>
      ) : (
        <div className="buttons">
          <a className="button is-primary" href={SIGN_UP_PATH}>Create an account</a>
          <span className="has-text-grey-dark">Already have one? Log in at the top of the page.</span>
        </div>
      )}

      <hr />

      <Columns>
        {FEATURES.map((feature) => (
          <Columns.Column key={feature.title}>
            <Heading size={5} renderAs="h3" className="mb-2">{feature.title}</Heading>
            <p>{feature.description}</p>
          </Columns.Column>
        ))}
      </Columns>

      <hr />

      <Heading size={5} renderAs="h3" className="has-text-centered">Grades at a glance</Heading>
      <div className="columns is-mobile is-multiline is-centered grade-samples">
        {SAMPLE_GRADES.map((sample) => (
          <div key={sample.label} className="column is-narrow">
            <GradeBox label={sample.label} grade={sample.grade} detail={sample.detail} />
          </div>
        ))}
      </div>
    </Box>
  )
}

export default Index
