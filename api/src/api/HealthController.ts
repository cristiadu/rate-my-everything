import { Request, Response, Router } from 'express'
import { DBConnection } from '@/index'

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
      // Check database connection
      const isConnected = DBConnection.isInitialized
      
      if (isConnected) {
        return res.status(200).json({
          status: 'ok',
          message: 'API is healthy',
          timestamp: new Date().toISOString(),
          database: {
            connected: true
          }
        })
      } else {
        return res.status(503).json({
          status: 'error',
          message: 'Database connection issue',
          timestamp: new Date().toISOString(),
          database: {
            connected: false
          }
        })
      }
    } catch (error) {
      console.error('Health check failed:', error)
      return res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      })
    }
  }
}