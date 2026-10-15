import {
  Body, Controller, Delete, Get, Path, Post, Put, Request, Res, Response, Route, Security, SuccessResponse, Tags,
} from 'tsoa'
import type { TsoaResponse } from 'tsoa'
import RatedItemService from '@/services/RatedItemService'
import APIError, { NewApiError } from '@/models/APIError'
import UserRole from '@/models/UserRole'
import ErrorCode from '@/errors/ErrorCode'
import RatedItem from '@/models/RatedItem'
import type { NewRatingInput, RatedItemResponse, RatingInput } from '@/models/RatedItem'
import { BEARER_AUTH } from '@/helpers/Authentication'
import type { AuthenticatedRequest } from '@/helpers/Authentication'

@Route('ratings')
@Tags('Ratings')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])
@Response<APIError>(401, 'The bearer token is missing or invalid')
@Response<APIError>(403, 'The signed-in user may not call this operation')
@Response<APIError>(500, 'Something unexpected failed')
export class RatedItemController extends Controller {
  private ratedItemService = new RatedItemService()

  /** @summary Lists every rating */
  @Get()
  public async getRatings(): Promise<RatedItemResponse[]> {
    return this.ratedItemService.getAll()
  }

  /** @summary Lists the ratings of a user */
  @Get('user/{user_id}')
  public async getRatingsByUser(@Path('user_id') userId: number): Promise<RatedItemResponse[]> {
    return this.ratedItemService.getAllByUserId(userId)
  }

  /** @summary Lists every user's ratings of an item, used to work out its collective grade */
  @Get('item/{item_id}')
  public async getRatingsByItem(@Path('item_id') itemId: number): Promise<RatedItemResponse[]> {
    return this.ratedItemService.getAllByItemId(itemId)
  }

  /** @summary Lists the signed-in user's ratings, each with its item and category */
  @Get('mine')
  public async getMyRatings(@Request() request: AuthenticatedRequest): Promise<RatedItemResponse[]> {
    return this.ratedItemService.getAllByUserId(request.user.id)
  }

  /** @summary Gets a rating */
  @Get('{id}')
  public async getRating(@Path() id: number, @Res() notFound: TsoaResponse<404, APIError>): Promise<RatedItemResponse> {
    const data = await this.ratedItemService.get(id)
    if (!data) {
      return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Rated item not found'))
    }
    return data
  }

  /** @summary Rates an item as the signed-in user */
  @Post()
  @SuccessResponse(201, 'Rating created')
  public async createRating(
    @Request() request: AuthenticatedRequest, @Body() input: NewRatingInput, @Res() validationError: TsoaResponse<400, APIError>,
  ): Promise<RatedItemResponse> {
    const { item_id: itemId, rating, notes } = input
    if (!itemId || typeof rating !== 'number') {
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required fields: item_id, rating'))
    }
    const data = await this.ratedItemService.create(itemId, request.user.id, rating, notes ?? undefined)
    this.setStatus(201)
    return data
  }

  /** @summary Changes a rating */
  @Put('{id}')
  public async updateRating(
    @Path() id: number, @Body() input: Partial<RatingInput>, @Res() notFound: TsoaResponse<404, APIError>,
  ): Promise<RatedItemResponse> {
    const data = await this.ratedItemService.update(id, input as RatedItem)
    if (!data) {
      return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Rated item not found'))
    }
    return data
  }

  /** @summary Deletes a rating */
  @Delete('{id}')
  @SuccessResponse(204, 'Rating deleted')
  public async deleteRating(@Path() id: number): Promise<void> {
    await this.ratedItemService.delete(id)
    this.setStatus(204)
  }
}
