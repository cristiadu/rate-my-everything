import { Request, Response, Router } from 'express'
import ChangeRequestService from '@/services/ChangeRequestService'
import { ChangeRequestInput } from '@/models/ChangeRequest'
import { SessionUser } from '@/models/User'
import { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { UnknownResource } from '@/errors/UnknownResource'
import { findChangeRequestError } from '@/helpers/ChangeRequestHelper'
import { logger } from '@/helpers/Logger'

/** Lets signed-in users propose changes to interests and categories and follow their own requests. */
export default class ChangeRequestController {
  public router = Router()

  private changeRequestService = new ChangeRequestService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', (req, res) => this.getMine(req, res))
    this.router.post('/', (req, res) => this.create(req, res))
  }

  /** Lists the signed-in user's change requests, newest first. */
  public async getMine(_req: Request, res: Response) {
    try {
      const sessionUser = res.locals.user as SessionUser
      const data = await this.changeRequestService.getAllByRequester(sessionUser.id)
      res.status(200).json(data)
    } catch (error) {
      logger.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  /** Saves a pending change request; 400 when it is malformed, 422 when its item or category does not exist. */
  public async create(req: Request, res: Response) {
    try {
      const changeRequestInput = req.body as ChangeRequestInput
      const validationError = findChangeRequestError(changeRequestInput)
      if (validationError) {
        return res.status(400).json(NewApiError(ErrorCode.VALIDATION_ERROR, 400, validationError))
      }
      const sessionUser = res.locals.user as SessionUser
      const data = await this.changeRequestService.create(sessionUser.id, changeRequestInput)
      res.status(201).json(data)
    } catch (error) {
      if (error instanceof UnknownResource) {
        return res.status(422).json(NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      logger.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }
}
