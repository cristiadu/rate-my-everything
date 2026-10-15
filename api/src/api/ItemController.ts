import {
  Body, Controller, Delete, Get, Path, Post, Put, Query, Request, Res, Response, Route, Security, SuccessResponse, Tags,
} from 'tsoa'
import type { TsoaResponse } from 'tsoa'
import ItemService from '@/services/ItemService'
import type { ItemInput, ItemResponse } from '@/models/Item'
import APIError, { NewApiError } from '@/models/APIError'
import UserRole from '@/models/UserRole'
import ErrorCode from '@/errors/ErrorCode'
import { canModerate } from '@/helpers/RouteHelper'
import { UnknownResource } from '@/errors/UnknownResource'
import { isValidSimilarName } from '@/helpers/SimilarityHelper'
import { BEARER_AUTH } from '@/helpers/Authentication'
import type { AuthenticatedRequest } from '@/helpers/Authentication'

/** Message returned when a user without a moderation role tries to change a shared interest directly. */
const MODERATION_REQUIRED_MESSAGE = 'Only moderators can change interests directly; send a change request instead'

@Route('items')
@Tags('Items')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])
@Response<APIError>(401, 'The bearer token is missing or invalid')
@Response<APIError>(403, 'The signed-in user may not call this operation')
@Response<APIError>(500, 'Something unexpected failed')
export class ItemController extends Controller {
  private itemService = new ItemService()

  /** @summary Lists every item */
  @Get()
  public async getItems(): Promise<ItemResponse[]> {
    return this.itemService.getAll()
  }

  /**
   * @summary Lists the items of a category
   * @param category Name of the category
   */
  @Get('category/{category}')
  public async getItemsByCategory(@Path() category: string): Promise<ItemResponse[]> {
    return this.itemService.getAllByCategory(category)
  }

  /**
   * Lists the items whose name is likely a duplicate of `name`, most similar first, only in `categoryId` when sent;
   * 400 when name is empty or categoryId is not an integer.
   * @summary Lists items with a name similar to the one given
   * @param name Name to compare with existing items
   * @param categoryId Only compare with the items of this category
   */
  @Get('similar')
  public async getSimilarItems(
    @Query() name: string, @Res() validationError: TsoaResponse<400, APIError>, @Query() categoryId?: number,
  ): Promise<ItemResponse[]> {
    if (!isValidSimilarName(name)) {
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Invalid value for name: it must be a non-empty text'))
    }
    if (categoryId !== undefined && !Number.isInteger(categoryId)) {
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Invalid value for categoryId: it must be an integer'))
    }
    return this.itemService.getSimilar(name, categoryId)
  }

  /** @summary Gets an item */
  @Get('{id}')
  public async getItem(@Path() id: number, @Res() notFound: TsoaResponse<404, APIError>): Promise<ItemResponse> {
    const data = await this.itemService.get(id)
    if (!data) {
      return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Item not found'))
    }
    return data
  }

  /** @summary Creates an item with its attribute values; 422 for an unknown category or attribute */
  @Post()
  @SuccessResponse(201, 'Item created')
  public async createItem(
    @Body() input: ItemInput,
    @Res() validationError: TsoaResponse<400, APIError>,
    @Res() unprocessable: TsoaResponse<422, APIError>,
  ): Promise<ItemResponse> {
    if (!input.name || input.categoryId === undefined) {
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required fields: name, categoryId'))
    }

    try {
      const data = await this.itemService.create(input)
      this.setStatus(201)
      return data
    } catch (error) {
      if (error instanceof UnknownResource) {
        return unprocessable(422, NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      throw error
    }
  }

  /** @summary Changes the fields sent for an item; 403 for users without a moderation role, 422 for an unknown category or attribute */
  @Put('{id}')
  public async updateItem(
    @Request() request: AuthenticatedRequest,
    @Path() id: number,
    @Body() input: ItemInput,
    @Res() moderationRequired: TsoaResponse<403, APIError>,
    @Res() notFound: TsoaResponse<404, APIError>,
    @Res() unprocessable: TsoaResponse<422, APIError>,
  ): Promise<ItemResponse> {
    if (!canModerate(request.user.roles)) {
      return moderationRequired(403, NewApiError(ErrorCode.FORBIDDEN, 403, MODERATION_REQUIRED_MESSAGE))
    }

    try {
      const data = await this.itemService.update(id, input)
      if (!data) {
        return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Item not found'))
      }
      return data
    } catch (error) {
      if (error instanceof UnknownResource) {
        return unprocessable(422, NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      throw error
    }
  }

  /** @summary Deletes an item; 403 for users without a moderation role */
  @Delete('{id}')
  @SuccessResponse(204, 'Item deleted')
  public async deleteItem(
    @Request() request: AuthenticatedRequest, @Path() id: number, @Res() moderationRequired: TsoaResponse<403, APIError>,
  ): Promise<void> {
    if (!canModerate(request.user.roles)) {
      return moderationRequired(403, NewApiError(ErrorCode.FORBIDDEN, 403, MODERATION_REQUIRED_MESSAGE))
    }
    await this.itemService.delete(id)
    this.setStatus(204)
  }
}
