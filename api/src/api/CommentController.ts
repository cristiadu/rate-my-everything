import {
  Body, Controller, Delete, Get, Path, Post, Request, Res, Response, Route, Security, SuccessResponse, Tags,
} from 'tsoa'
import type { TsoaResponse } from 'tsoa'
import CommentService from '@/services/CommentService'
import { MAX_COMMENT_LENGTH } from '@/models/Comment'
import type { CommentInput, CommentResponse } from '@/models/Comment'
import APIError, { NewApiError } from '@/models/APIError'
import UserRole from '@/models/UserRole'
import ErrorCode from '@/errors/ErrorCode'
import { UnknownResource } from '@/errors/UnknownResource'
import { CommentNotOwned } from '@/errors/CommentNotOwned'
import { BEARER_AUTH } from '@/helpers/Authentication'
import type { AuthenticatedRequest } from '@/helpers/Authentication'

/** Discussion threads on items: list an item's comments, post one, and delete one. */
@Route('comments')
@Tags('Comments')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])
@Response<APIError>(401, 'The bearer token is missing or invalid')
@Response<APIError>(403, 'The signed-in user may not call this operation')
@Response<APIError>(500, 'Something unexpected failed')
export class CommentController extends Controller {
  private commentService = new CommentService()

  /** @summary Lists the comments on an item, oldest first */
  @Get('item/{item_id}')
  public async getCommentsByItem(@Path('item_id') itemId: number): Promise<CommentResponse[]> {
    return this.commentService.getAllByItemId(itemId)
  }

  /** @summary Posts a comment to an item as the signed-in user; 400 when the body is missing or too long */
  @Post('item/{item_id}')
  @SuccessResponse(201, 'Comment posted')
  public async createComment(
    @Request() request: AuthenticatedRequest,
    @Path('item_id') itemId: number,
    @Body() input: CommentInput,
    @Res() validationError: TsoaResponse<400, APIError>,
    @Res() notFound: TsoaResponse<404, APIError>,
  ): Promise<CommentResponse> {
    const trimmedBody = typeof input.body === 'string' ? input.body.trim() : ''
    if (!Number.isInteger(itemId) || itemId <= 0 || !trimmedBody) {
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required fields: item_id, body'))
    }
    if (trimmedBody.length > MAX_COMMENT_LENGTH) {
      const message = `Comment body must be at most ${MAX_COMMENT_LENGTH} characters`
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, message))
    }

    try {
      const data = await this.commentService.create(itemId, request.user.id, trimmedBody)
      this.setStatus(201)
      return data
    } catch (error) {
      if (error instanceof UnknownResource) {
        const resourceName = `${error.resource[0].toUpperCase()}${error.resource.slice(1)}`
        return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, `${resourceName} not found`))
      }
      throw error
    }
  }

  /** @summary Deletes a comment; 403 unless the signed-in user wrote it or is an admin or moderator */
  @Delete('{id}')
  @SuccessResponse(204, 'Comment deleted')
  public async deleteComment(
    @Request() request: AuthenticatedRequest, @Path() id: number, @Res() notOwned: TsoaResponse<403, APIError>,
  ): Promise<void> {
    try {
      await this.commentService.delete(id, request.user)
      this.setStatus(204)
    } catch (error) {
      if (error instanceof CommentNotOwned) {
        return notOwned(403, NewApiError(ErrorCode.FORBIDDEN, 403, error.message))
      }
      throw error
    }
  }
}
