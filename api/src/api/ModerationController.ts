import { Request, Response, Router } from 'express'
import ChangeRequestService from '@/services/ChangeRequestService'
import { ChangeRequestReview } from '@/models/ChangeRequest'
import ChangeRequestStatus from '@/models/ChangeRequestStatus'
import { SessionUser } from '@/models/User'
import { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { ChangeRequestNotPending } from '@/errors/ChangeRequestNotPending'
import { ResourceAlreadyExists } from '@/errors/ResourceAlreadyExists'
import { UnknownResource } from '@/errors/UnknownResource'
import { isChangeRequestStatus } from '@/helpers/ChangeRequestHelper'

/** Lets moderators and admins list change requests and approve or reject them. */
export default class ModerationController {
  public router = Router()

  private changeRequestService = new ChangeRequestService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/change-requests', (req, res) => this.getAll(req, res))
    this.router.put('/change-requests/:id/approve', (req, res) => this.approve(req, res))
    this.router.put('/change-requests/:id/reject', (req, res) => this.reject(req, res))
  }

  /** Lists change requests, newest first, optionally filtered by `?status=`; 400 for an unknown status. */
  public async getAll(req: Request, res: Response) {
    try {
      const status = req.query.status as string | undefined
      if (status !== undefined && !isChangeRequestStatus(status)) {
        return res.status(400).json(NewApiError(
          ErrorCode.VALIDATION_ERROR, 400, `status must be one of: ${Object.values(ChangeRequestStatus).join(', ')}`,
        ))
      }
      const data = await this.changeRequestService.getAll(status)
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  /** Applies a pending change request; 404 when it does not exist, 422 when it was reviewed or can no longer be applied. */
  public async approve(req: Request, res: Response) {
    try {
      const sessionUser = res.locals.user as SessionUser
      const data = await this.changeRequestService.approve(parseInt(req.params.id, 10), sessionUser.id, req.body as ChangeRequestReview)
      if (!data) {
        return res.status(404).json(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Change request not found'))
      }
      res.status(200).json(data)
    } catch (error) {
      if (error instanceof ChangeRequestNotPending || error instanceof UnknownResource) {
        return res.status(422).json(NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      if (error instanceof ResourceAlreadyExists) {
        return res.status(422).json(NewApiError(ErrorCode.RESOURCE_ALREADY_EXISTS, 422, error.message))
      }
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  /** Rejects a pending change request; 404 when it does not exist, 422 when it was already reviewed. */
  public async reject(req: Request, res: Response) {
    try {
      const sessionUser = res.locals.user as SessionUser
      const data = await this.changeRequestService.reject(parseInt(req.params.id, 10), sessionUser.id, req.body as ChangeRequestReview)
      if (!data) {
        return res.status(404).json(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Change request not found'))
      }
      res.status(200).json(data)
    } catch (error) {
      if (error instanceof ChangeRequestNotPending) {
        return res.status(422).json(NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }
}
