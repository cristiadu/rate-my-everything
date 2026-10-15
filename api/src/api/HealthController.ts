import { Controller, Get, Response, Route, Tags } from 'tsoa'
import { runHealthChecks } from '@/services/HealthIndicators'
import { Health, HealthStatus } from '@/models/Health'

@Route('health')
@Tags('Health')
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
