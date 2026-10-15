import { Request, Response, Router } from 'express'
import { runHealthChecks } from '@/services/HealthIndicators'
import { HealthStatus } from '@/models/Health'
import { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { logger } from '@/helpers/Logger'

export default class HealthController {
  public router = Router()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', (req, res) => {
      this.getHealth(req, res)
    })
  }

  public async getHealth(_req: Request, res: Response) {
    try {
      const health = await runHealthChecks()
      
      if (health.status === HealthStatus.HEALTHY) {
          res.status(200)
            .json(health)
      } else {
        return res.status(500).json(health)
      }
    } catch (error) {
      logger.error(error, 'Health check failed')
        res.status(500)
          .json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }
}
