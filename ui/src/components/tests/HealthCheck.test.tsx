import React from 'react'
import { render } from '@testing-library/react'
import HealthCheck from '@/components/health/HealthCheck'

/** Moment the health check is rendered at, so its timestamps are known. */
const CHECKED_AT = '2026-10-16T12:00:00.000Z'

/** The health status meta tag the page adds to the document head. */
const healthMeta = () => document.head.querySelector('meta[name="health-status"]')

describe('HealthCheck', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(CHECKED_AT) })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('reports a healthy frontend in the page title, a meta tag and a hidden marker', () => {
    // GIVEN the health page
    // WHEN it renders
    const { container } = render(<HealthCheck />)

    // THEN the title, meta tag and hidden marker all report the frontend as healthy at that moment
    expect(document.title).toBe('Health Check OK')
    expect(JSON.parse(String(healthMeta()?.getAttribute('content')))).toEqual({
      status: 'ok', message: 'Frontend is healthy', timestamp: CHECKED_AT,
    })
    const marker = container.querySelector('#health-check')
    expect(marker).toHaveAttribute('data-status', 'ok')
    expect(marker).toHaveAttribute('data-timestamp', CHECKED_AT)
    expect(marker).not.toBeVisible()
  })

  test('removes its meta tag when the page is left', () => {
    // GIVEN the rendered health page
    const { unmount } = render(<HealthCheck />)

    // WHEN it unmounts
    unmount()

    // THEN the meta tag is gone
    expect(healthMeta()).not.toBeInTheDocument()
  })
})
