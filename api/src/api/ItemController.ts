import {
  Body, Controller, Delete, Get, Path, Post, Put, Query, Request, Response, Route, Security, SuccessResponse, Tags,
} from 'tsoa'
import ItemService from '@/services/ItemService'
import type { ItemInput, ItemResponse } from '@/models/Item'
import APIError, { NewApiError } from '@/models/APIError'
import UserRole from '@/models/UserRole'
import ErrorCode from '@/errors/ErrorCode'
import { RequestRejected } from '@/errors/RequestRejected'
import { canModerate } from '@/helpers/RouteHelper'
import { UnknownResource } from '@/errors/UnknownResource'
import { isValidSimilarName } from '@/helpers/SimilarityHelper'
import { BEARER_AUTH } from '@/helpers/Authentication'
import type { AuthenticatedRequest } from '@/helpers/Authentication'
import {
  BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE, INTERNAL_ERROR_DESCRIPTION,
  INTERNAL_ERROR_EXAMPLE, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
  UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE, UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE,
} from '@/api/ApiDocumentation'
import type { RateLimitHeaders } from '@/api/ApiDocumentation'
import type { ResourceId } from '@/models/ResourceId'

/** Message returned when a user without a moderation role tries to change a shared interest directly. */
const MODERATION_REQUIRED_MESSAGE = 'Only moderators can change interests directly; send a change request instead'

/** Items are the interests users rate; users add them and moderators change or delete them. */
@Route('items')
@Tags('Items')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])
@Response<APIError>(401, UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE)
@Response<APIError>(403, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE)
@Response<APIError, { [Header in keyof RateLimitHeaders]: RateLimitHeaders[Header] }>(
  429, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
)
@Response<APIError>(500, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE)
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
   * @example category "Books"
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
   * @example name "Dune"
   */
  @Get('similar')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async getSimilarItems(@Query() name: string, @Query() categoryId?: ResourceId): Promise<ItemResponse[]> {
    if (!isValidSimilarName(name)) {
      throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Invalid value for name: it must be a non-empty text'))
    }
    return this.itemService.getSimilar(name, categoryId)
  }

  /**
   * @summary Gets an item
   * @param id Id of the item
   */
  @Get('{id}')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  public async getItem(@Path() id: ResourceId): Promise<ItemResponse> {
    const data = await this.itemService.get(id)
    if (!data) {
      throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Item not found'))
    }
    return data
  }

  /** @summary Creates an item with its attribute values; 422 for an unknown category or attribute */
  @Post()
  @SuccessResponse(201, 'Item created')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(422, UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE)
  public async createItem(@Body() input: ItemInput): Promise<ItemResponse> {
    if (!input.name || input.categoryId === undefined) {
      throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required fields: name, categoryId'))
    }

    try {
      const data = await this.itemService.create(input)
      this.setStatus(201)
      return data
    } catch (error) {
      if (error instanceof UnknownResource) {
        throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      throw error
    }
  }

  /**
   * @summary Changes the fields sent for an item; 403 for users without a moderation role, 422 for an unknown category or attribute
   * @param id Id of the item
   */
  @Put('{id}')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  @Response<APIError>(422, UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE)
  public async updateItem(
    @Request() request: AuthenticatedRequest, @Path() id: ResourceId, @Body() input: ItemInput,
  ): Promise<ItemResponse> {
    if (!canModerate(request.user.roles)) {
      throw new RequestRejected(NewApiError(ErrorCode.FORBIDDEN, 403, MODERATION_REQUIRED_MESSAGE))
    }

    try {
      const data = await this.itemService.update(id, input)
      if (!data) {
        throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Item not found'))
      }
      return data
    } catch (error) {
      if (error instanceof UnknownResource) {
        throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      throw error
    }
  }

  /**
   * @summary Deletes an item; 403 for users without a moderation role
   * @param id Id of the item
   */
  @Delete('{id}')
  @SuccessResponse(204, 'Item deleted')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async deleteItem(@Request() request: AuthenticatedRequest, @Path() id: ResourceId): Promise<void> {
    if (!canModerate(request.user.roles)) {
      throw new RequestRejected(NewApiError(ErrorCode.FORBIDDEN, 403, MODERATION_REQUIRED_MESSAGE))
    }
    await this.itemService.delete(id)
    this.setStatus(204)
  }
}
