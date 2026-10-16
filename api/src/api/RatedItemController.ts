import {
  Body, Controller, Delete, Get, Path, Post, Put, Queries, Request, Response, Route, Security, SuccessResponse, Tags,
} from 'tsoa'
import RatedItemService from '@/services/RatedItemService'
import APIError, { NewApiError } from '@/models/APIError'
import UserRole from '@/models/UserRole'
import ErrorCode from '@/errors/ErrorCode'
import { RequestRejected } from '@/errors/RequestRejected'
import { RatingNotOwned } from '@/errors/RatingNotOwned'
import type {
  NewRatingInput, RatedItemResponse, RatingQuery, RatingUpdate,
} from '@/models/RatedItem'
import { parseRatingFilters } from '@/helpers/RatingFilterHelper'
import { BEARER_AUTH } from '@/helpers/Authentication'
import type { AuthenticatedRequest } from '@/helpers/Authentication'
import {
  BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE, INTERNAL_ERROR_DESCRIPTION,
  INTERNAL_ERROR_EXAMPLE, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
  UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE,
} from '@/api/ApiDocumentation'
import type { RateLimitHeaders } from '@/api/ApiDocumentation'
import type { ResourceId } from '@/models/ResourceId'

/** Users' grades for items, from 0 to 10, with optional notes. */
@Route('ratings')
@Tags('Ratings')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])
@Response<APIError>(401, UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE)
@Response<APIError>(403, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE)
@Response<APIError, { [Header in keyof RateLimitHeaders]: RateLimitHeaders[Header] }>(
  429, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
)
@Response<APIError>(500, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE)
export class RatedItemController extends Controller {
  private ratedItemService = new RatedItemService()

  /**
   * Every rating of the items matching the filters, so each item's grades stay complete. Without filters, every rating.
   * @summary Lists the ratings of the items matching the filters
   */
  @Get()
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async getRatings(@Request() request: AuthenticatedRequest, @Queries() query: RatingQuery): Promise<RatedItemResponse[]> {
    return this.ratedItemService.getAll(parseRatingFilters(query), request.user.id)
  }

  /**
   * @summary Lists the ratings of a user
   * @param userId Id of the user
   */
  @Get('user/{user_id}')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async getRatingsByUser(@Path('user_id') userId: ResourceId): Promise<RatedItemResponse[]> {
    return this.ratedItemService.getAllByUserId(userId)
  }

  /**
   * @summary Lists every user's ratings of an item, used to work out its collective grade
   * @param itemId Id of the item
   */
  @Get('item/{item_id}')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async getRatingsByItem(@Path('item_id') itemId: ResourceId): Promise<RatedItemResponse[]> {
    return this.ratedItemService.getAllByItemId(itemId)
  }

  /** @summary Lists the signed-in user's ratings, each with its item and category */
  @Get('mine')
  public async getMyRatings(@Request() request: AuthenticatedRequest): Promise<RatedItemResponse[]> {
    return this.ratedItemService.getAllByUserId(request.user.id)
  }

  /**
   * @summary Gets a rating
   * @param id Id of the rating
   */
  @Get('{id}')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  public async getRating(@Path() id: ResourceId): Promise<RatedItemResponse> {
    const data = await this.ratedItemService.get(id)
    if (!data) {
      throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Rated item not found'))
    }
    return data
  }

  /** @summary Rates an item as the signed-in user */
  @Post()
  @SuccessResponse(201, 'Rating created')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async createRating(@Request() request: AuthenticatedRequest, @Body() input: NewRatingInput): Promise<RatedItemResponse> {
    const { item_id: itemId, rating, notes } = input
    if (!itemId || typeof rating !== 'number') {
      throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required fields: item_id, rating'))
    }
    const data = await this.ratedItemService.create(itemId, request.user.id, rating, notes ?? undefined)
    this.setStatus(201)
    return data
  }

  /**
   * Changes a rating; 403 when it belongs to another user.
   * @summary Changes a rating
   * @param id Id of the rating
   */
  @Put('{id}')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  public async updateRating(
    @Request() request: AuthenticatedRequest, @Path() id: ResourceId, @Body() input: RatingUpdate,
  ): Promise<RatedItemResponse> {
    // Copy only the editable fields so a request body can never move a rating to another item or user
    const { rating, notes } = input
    const changes = { ...(rating !== undefined && { rating }), ...(notes !== undefined && { notes }) }
    try {
      const data = await this.ratedItemService.update(id, changes, request.user)
      if (!data) {
        throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Rated item not found'))
      }
      return data
    } catch (error) {
      if (error instanceof RatingNotOwned) {
        throw new RequestRejected(NewApiError(ErrorCode.FORBIDDEN, 403, error.message))
      }
      throw error
    }
  }

  /**
   * Deletes a rating; 403 unless it is the signed-in user's own or they moderate.
   * @summary Deletes a rating
   * @param id Id of the rating
   */
  @Delete('{id}')
  @SuccessResponse(204, 'Rating deleted')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async deleteRating(@Request() request: AuthenticatedRequest, @Path() id: ResourceId): Promise<void> {
    try {
      await this.ratedItemService.delete(id, request.user)
      this.setStatus(204)
    } catch (error) {
      if (error instanceof RatingNotOwned) {
        throw new RequestRejected(NewApiError(ErrorCode.FORBIDDEN, 403, error.message))
      }
      throw error
    }
  }
}
