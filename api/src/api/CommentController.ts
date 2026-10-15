import {
  Body, Controller, Delete, Get, Path, Post, Request, Response, Route, Security, SuccessResponse, Tags,
} from 'tsoa'
import CommentService from '@/services/CommentService'
import type { CommentInput, CommentResponse } from '@/models/Comment'
import APIError, { NewApiError } from '@/models/APIError'
import UserRole from '@/models/UserRole'
import ErrorCode from '@/errors/ErrorCode'
import { RequestRejected } from '@/errors/RequestRejected'
import { UnknownResource } from '@/errors/UnknownResource'
import { CommentNotOwned } from '@/errors/CommentNotOwned'
import { BEARER_AUTH } from '@/helpers/Authentication'
import type { AuthenticatedRequest } from '@/helpers/Authentication'
import {
  BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE, INTERNAL_ERROR_DESCRIPTION,
  INTERNAL_ERROR_EXAMPLE, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
  UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE,
} from '@/api/ApiDocumentation'
import type { RateLimitHeaders } from '@/api/ApiDocumentation'
import type { ResourceId } from '@/models/ResourceId'

/** Discussion threads on items: list an item's comments, post one, and delete one. */
@Route('comments')
@Tags('Comments')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])
@Response<APIError>(401, UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE)
@Response<APIError>(403, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE)
@Response<APIError, { [Header in keyof RateLimitHeaders]: RateLimitHeaders[Header] }>(
  429, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
)
@Response<APIError>(500, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE)
export class CommentController extends Controller {
  private commentService = new CommentService()

  /**
   * @summary Lists the comments on an item, oldest first
   * @param itemId Id of the item
   */
  @Get('item/{item_id}')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async getCommentsByItem(@Path('item_id') itemId: ResourceId): Promise<CommentResponse[]> {
    return this.commentService.getAllByItemId(itemId)
  }

  /**
   * @summary Posts a comment to an item as the signed-in user; 400 when the body is missing or too long
   * @param itemId Id of the item
   */
  @Post('item/{item_id}')
  @SuccessResponse(201, 'Comment posted')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  public async createComment(
    @Request() request: AuthenticatedRequest, @Path('item_id') itemId: ResourceId, @Body() input: CommentInput,
  ): Promise<CommentResponse> {
    const trimmedBody = typeof input.body === 'string' ? input.body.trim() : ''
    if (!Number.isInteger(itemId) || itemId <= 0 || !trimmedBody) {
      throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required fields: item_id, body'))
    }

    try {
      const data = await this.commentService.create(itemId, request.user.id, trimmedBody)
      this.setStatus(201)
      return data
    } catch (error) {
      if (error instanceof UnknownResource) {
        const resourceName = `${error.resource[0].toUpperCase()}${error.resource.slice(1)}`
        throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, `${resourceName} not found`))
      }
      throw error
    }
  }

  /**
   * @summary Deletes a comment; 403 unless the signed-in user wrote it or is an admin or moderator
   * @param id Id of the comment
   */
  @Delete('{id}')
  @SuccessResponse(204, 'Comment deleted')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async deleteComment(@Request() request: AuthenticatedRequest, @Path() id: ResourceId): Promise<void> {
    try {
      await this.commentService.delete(id, request.user)
      this.setStatus(204)
    } catch (error) {
      if (error instanceof CommentNotOwned) {
        throw new RequestRejected(NewApiError(ErrorCode.FORBIDDEN, 403, error.message))
      }
      throw error
    }
  }
}
