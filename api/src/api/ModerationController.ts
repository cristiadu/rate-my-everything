import { Body, Controller, Get, Path, Put, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import ChangeRequestService from '@/services/ChangeRequestService'
import type { ChangeRequestResponse, ChangeRequestReview } from '@/models/ChangeRequest'
import ChangeRequestStatus from '@/models/ChangeRequestStatus'
import APIError, { NewApiError } from '@/models/APIError'
import UserRole from '@/models/UserRole'
import ErrorCode from '@/errors/ErrorCode'
import { RequestRejected } from '@/errors/RequestRejected'
import { ChangeRequestNotPending } from '@/errors/ChangeRequestNotPending'
import { ResourceAlreadyExists } from '@/errors/ResourceAlreadyExists'
import { UnknownResource } from '@/errors/UnknownResource'
import { BEARER_AUTH } from '@/helpers/Authentication'
import type { AuthenticatedRequest } from '@/helpers/Authentication'
import {
  BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE, INTERNAL_ERROR_DESCRIPTION,
  INTERNAL_ERROR_EXAMPLE, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
  UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE, UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE,
} from '@/api/ApiDocumentation'
import type { RateLimitHeaders } from '@/api/ApiDocumentation'
import type { ResourceId } from '@/models/ResourceId'

/** Lets moderators and admins list change requests and approve or reject them. */
@Route('moderation')
@Tags('Moderation')
@Security(BEARER_AUTH, [UserRole.ADMIN, UserRole.MODERATOR])
@Response<APIError>(401, UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE)
@Response<APIError>(403, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE)
@Response<APIError, { [Header in keyof RateLimitHeaders]: RateLimitHeaders[Header] }>(
  429, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
)
@Response<APIError>(500, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE)
export class ModerationController extends Controller {
  private changeRequestService = new ChangeRequestService()

  /**
   * @summary Lists change requests, newest first
   * @param status Only list the change requests with this status
   */
  @Get('change-requests')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async getChangeRequests(@Query() status?: ChangeRequestStatus): Promise<ChangeRequestResponse[]> {
    return this.changeRequestService.getAll(status)
  }

  /**
   * @summary Applies a pending change request; 422 when it was reviewed or can no longer be applied
   * @param id Id of the change request
   */
  @Put('change-requests/{id}/approve')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  @Response<APIError>(422, UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE)
  public async approveChangeRequest(
    @Request() request: AuthenticatedRequest, @Path() id: ResourceId, @Body() review: ChangeRequestReview = {},
  ): Promise<ChangeRequestResponse> {
    try {
      const data = await this.changeRequestService.approve(id, request.user.id, review)
      if (!data) {
        throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Change request not found'))
      }
      return data
    } catch (error) {
      if (error instanceof ChangeRequestNotPending || error instanceof UnknownResource) {
        throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      if (error instanceof ResourceAlreadyExists) {
        throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_ALREADY_EXISTS, 422, error.message))
      }
      throw error
    }
  }

  /**
   * @summary Rejects a pending change request; 422 when it was already reviewed
   * @param id Id of the change request
   */
  @Put('change-requests/{id}/reject')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  @Response<APIError>(422, UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE)
  public async rejectChangeRequest(
    @Request() request: AuthenticatedRequest, @Path() id: ResourceId, @Body() review: ChangeRequestReview = {},
  ): Promise<ChangeRequestResponse> {
    try {
      const data = await this.changeRequestService.reject(id, request.user.id, review)
      if (!data) {
        throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Change request not found'))
      }
      return data
    } catch (error) {
      if (error instanceof ChangeRequestNotPending) {
        throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      throw error
    }
  }
}
