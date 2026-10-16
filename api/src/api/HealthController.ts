import { Controller, Get, Response, Route, Tags } from 'tsoa'
import { runHealthChecks } from '@/services/HealthIndicators'
import { Health, HealthStatus } from '@/models/Health'
import APIError from '@/models/APIError'
import { TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE } from '@/api/ApiDocumentation'
import type { RateLimitHeaders } from '@/api/ApiDocumentation'

/** Health check for monitors and load balancers; needs no bearer token. */
@Route('health')
@Tags('Health')
@Response<APIError, { [Header in keyof RateLimitHeaders]: RateLimitHeaders[Header] }>(
  429, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
)
export class HealthController extends Controller {
  /**
   * Reports whether the API and its database work.
   * @summary Reports whether the API and its database work
   */
  @Get()
  @Response<Health>(500, 'A service is unhealthy')
  public async getHealth(): Promise<Health> {
    const health = await runHealthChecks()
    if (health.status !== HealthStatus.HEALTHY) {
      this.setStatus(500)
    }
    return health
  }
}
