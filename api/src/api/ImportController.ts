import { Request, Response, Router } from 'express'
import ImportService from '@/services/imports/ImportService'
import ImportSource from '@/models/ImportSource'
import { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { UnknownResource } from '@/errors/UnknownResource'
import { ImportSourceFailed } from '@/errors/ImportSourceFailed'
import { ImportSourceNotConfigured } from '@/errors/ImportSourceNotConfigured'
import { logger } from '@/helpers/Logger'

export default class ImportController {
  public router = Router()

  private importService = new ImportService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/:source', (req, res) => this.findItems(req, res))
  }

  /**
   * Lists the items found on an external source for the `query` parameter, without saving them.
   * 400 for an unknown source or a missing query, 404 when the user or playlist does not exist,
   * 502 when the source fails, and 503 when the source has no API key configured.
   */
  public async findItems(req: Request, res: Response) {
    const source = req.params.source as ImportSource
    const query = req.query.query
    if (!Object.values(ImportSource).includes(source)) {
      return res.status(400).json(NewApiError(ErrorCode.VALIDATION_ERROR, 400, `Unknown import source: ${source}`))
    }
    if (typeof query !== 'string' || !query.trim()) {
      return res.status(400).json(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required query parameter: query'))
    }

    try {
      const data = await this.importService.findItems(source, query.trim())
      res.status(200).json(data)
    } catch (error) {
      if (error instanceof UnknownResource) {
        return res.status(404).json(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, error.message))
      }
      if (error instanceof ImportSourceFailed) {
        logger.error(error)
        return res.status(502).json(NewApiError(ErrorCode.EXTERNAL_SERVICE_ERROR, 502, error.message))
      }
      if (error instanceof ImportSourceNotConfigured) {
        return res.status(503).json(NewApiError(ErrorCode.SERVICE_UNAVAILABLE, 503, error.message))
      }
      logger.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }
}
