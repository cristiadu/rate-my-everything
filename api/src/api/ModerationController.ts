import { Body, Controller, Get, Path, Put, Query, Request, Res, Response, Route, Security, Tags } from 'tsoa'
import type { TsoaResponse } from 'tsoa'
import ChangeRequestService from '@/services/ChangeRequestService'
import type { ChangeRequestResponse, ChangeRequestReview } from '@/models/ChangeRequest'
import ChangeRequestStatus from '@/models/ChangeRequestStatus'
import APIError, { NewApiError } from '@/models/APIError'
import UserRole from '@/models/UserRole'
import ErrorCode from '@/errors/ErrorCode'
import { ChangeRequestNotPending } from '@/errors/ChangeRequestNotPending'
import { ResourceAlreadyExists } from '@/errors/ResourceAlreadyExists'
import { UnknownResource } from '@/errors/UnknownResource'
import { BEARER_AUTH } from '@/helpers/Authentication'
import type { AuthenticatedRequest } from '@/helpers/Authentication'

/** Lets moderators and admins list change requests and approve or reject them. */
@Route('moderation')
@Tags('Moderation')
@Security(BEARER_AUTH, [UserRole.ADMIN, UserRole.MODERATOR])
@Response<APIError>(401, 'The bearer token is missing or invalid')
@Response<APIError>(403, 'The signed-in user may not call this operation')
@Response<APIError>(500, 'Something unexpected failed')
export class ModerationController extends Controller {
  private changeRequestService = new ChangeRequestService()

  /**
   * @summary Lists change requests, newest first
   * @param status Only list the change requests with this status
   */
  @Get('change-requests')
  public async getChangeRequests(@Query() status?: ChangeRequestStatus): Promise<ChangeRequestResponse[]> {
    return this.changeRequestService.getAll(status)
  }

  /** @summary Applies a pending change request; 422 when it was reviewed or can no longer be applied */
  @Put('change-requests/{id}/approve')
  public async approveChangeRequest(
    @Request() request: AuthenticatedRequest,
    @Path() id: number,
    @Body() review: ChangeRequestReview = {},
    @Res() notFound: TsoaResponse<404, APIError>,
    @Res() unprocessable: TsoaResponse<422, APIError>,
  ): Promise<ChangeRequestResponse> {
    try {
      const data = await this.changeRequestService.approve(id, request.user.id, review)
      if (!data) {
        return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Change request not found'))
      }
      return data
    } catch (error) {
      if (error instanceof ChangeRequestNotPending || error instanceof UnknownResource) {
        return unprocessable(422, NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      if (error instanceof ResourceAlreadyExists) {
        return unprocessable(422, NewApiError(ErrorCode.RESOURCE_ALREADY_EXISTS, 422, error.message))
      }
      throw error
    }
  }

  /** @summary Rejects a pending change request; 422 when it was already reviewed */
  @Put('change-requests/{id}/reject')
  public async rejectChangeRequest(
    @Request() request: AuthenticatedRequest,
    @Path() id: number,
    @Body() review: ChangeRequestReview = {},
    @Res() notFound: TsoaResponse<404, APIError>,
    @Res() unprocessable: TsoaResponse<422, APIError>,
  ): Promise<ChangeRequestResponse> {
    try {
      const data = await this.changeRequestService.reject(id, request.user.id, review)
      if (!data) {
        return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Change request not found'))
      }
      return data
    } catch (error) {
      if (error instanceof ChangeRequestNotPending) {
        return unprocessable(422, NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      throw error
    }
  }
}
