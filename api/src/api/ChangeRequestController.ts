import { Body, Controller, Get, Post, Request, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import ChangeRequestService from '@/services/ChangeRequestService'
import type { ChangeRequestInput, ChangeRequestResponse } from '@/models/ChangeRequest'
import APIError, { NewApiError } from '@/models/APIError'
import UserRole from '@/models/UserRole'
import ErrorCode from '@/errors/ErrorCode'
import { RequestRejected } from '@/errors/RequestRejected'
import { UnknownResource } from '@/errors/UnknownResource'
import { findChangeRequestError } from '@/helpers/ChangeRequestHelper'
import { BEARER_AUTH } from '@/helpers/Authentication'
import type { AuthenticatedRequest } from '@/helpers/Authentication'
import {
  BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE, INTERNAL_ERROR_DESCRIPTION,
  INTERNAL_ERROR_EXAMPLE, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE, UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE,
  UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE,
} from '@/api/ApiDocumentation'
import type { RateLimitHeaders } from '@/api/ApiDocumentation'

/** Lets signed-in users propose changes to interests and categories and follow their own requests. */
@Route('change-requests')
@Tags('Change requests')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR])
@Response<APIError>(401, UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE)
@Response<APIError>(403, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE)
@Response<APIError, { [Header in keyof RateLimitHeaders]: RateLimitHeaders[Header] }>(
  429, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
)
@Response<APIError>(500, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE)
export class ChangeRequestController extends Controller {
  private changeRequestService = new ChangeRequestService()

  /** @summary Lists the signed-in user's change requests, newest first */
  @Get()
  public async getMyChangeRequests(@Request() request: AuthenticatedRequest): Promise<ChangeRequestResponse[]> {
    return this.changeRequestService.getAllByRequester(request.user.id)
  }

  /** @summary Proposes a change to an interest or category; 422 when its item or category does not exist */
  @Post()
  @SuccessResponse(201, 'Change request saved as pending')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(422, UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE)
  public async createChangeRequest(
    @Request() request: AuthenticatedRequest, @Body() input: ChangeRequestInput,
  ): Promise<ChangeRequestResponse> {
    const changeRequestError = findChangeRequestError(input)
    if (changeRequestError) {
      throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 400, changeRequestError))
    }

    try {
      const data = await this.changeRequestService.create(request.user.id, input)
      this.setStatus(201)
      return data
    } catch (error) {
      if (error instanceof UnknownResource) {
        throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      throw error
    }
  }
}
