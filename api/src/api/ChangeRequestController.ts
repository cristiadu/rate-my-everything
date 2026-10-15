import { Body, Controller, Get, Post, Request, Res, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import type { TsoaResponse } from 'tsoa'
import ChangeRequestService from '@/services/ChangeRequestService'
import type { ChangeRequestInput, ChangeRequestResponse } from '@/models/ChangeRequest'
import APIError, { NewApiError } from '@/models/APIError'
import UserRole from '@/models/UserRole'
import ErrorCode from '@/errors/ErrorCode'
import { UnknownResource } from '@/errors/UnknownResource'
import { findChangeRequestError } from '@/helpers/ChangeRequestHelper'
import { BEARER_AUTH } from '@/helpers/Authentication'
import type { AuthenticatedRequest } from '@/helpers/Authentication'

/** Lets signed-in users propose changes to interests and categories and follow their own requests. */
@Route('change-requests')
@Tags('Change requests')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR])
@Response<APIError>(401, 'The bearer token is missing or invalid')
@Response<APIError>(403, 'The signed-in user may not call this operation')
@Response<APIError>(500, 'Something unexpected failed')
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
  public async createChangeRequest(
    @Request() request: AuthenticatedRequest,
    @Body() input: ChangeRequestInput,
    @Res() validationError: TsoaResponse<400, APIError>,
    @Res() unprocessable: TsoaResponse<422, APIError>,
  ): Promise<ChangeRequestResponse> {
    const changeRequestError = findChangeRequestError(input)
    if (changeRequestError) {
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, changeRequestError))
    }

    try {
      const data = await this.changeRequestService.create(request.user.id, input)
      this.setStatus(201)
      return data
    } catch (error) {
      if (error instanceof UnknownResource) {
        return unprocessable(422, NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      throw error
    }
  }
}
