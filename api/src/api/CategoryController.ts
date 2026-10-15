import {
  Body, Controller, Delete, Get, Path, Post, Put, Query, Res, Response, Route, Security, SuccessResponse, Tags,
} from 'tsoa'
import type { TsoaResponse } from 'tsoa'
import CategoryService from '@/services/CategoryService'
import APIError, { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import type { CategoryInput, CategoryResponse } from '@/models/Category'
import UserRole from '@/models/UserRole'
import { isEmpty } from 'class-validator'
import { ResourceAlreadyExists } from '@/errors/ResourceAlreadyExists'
import { UnknownResource } from '@/errors/UnknownResource'
import { isValidAttributeIds } from '@/helpers/CategoryHelper'
import { isValidSimilarName } from '@/helpers/SimilarityHelper'
import { BEARER_AUTH } from '@/helpers/Authentication'

/** Message returned when attributeIds is not a list of integers. */
const INVALID_ATTRIBUTE_IDS_MESSAGE = 'attributeIds must be an array of integers'

/** Categories group items and list the attributes that describe them; users read them and admins change them. */
@Route('categories')
@Tags('Categories')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])
@Response<APIError>(401, 'The bearer token is missing or invalid')
@Response<APIError>(403, 'The signed-in user may not call this operation')
@Response<APIError>(500, 'Something unexpected failed')
export class CategoryController extends Controller {
  private categoryService = new CategoryService()

  /** @summary Lists every category with its attributes */
  @Get()
  public async getCategories(): Promise<CategoryResponse[]> {
    return this.categoryService.getAll()
  }

  /**
   * Lists the categories whose name is likely a duplicate of `name`, most similar first; 400 when name is empty.
   * @summary Lists categories with a name similar to the one given
   * @param name Name to compare with existing categories
   */
  @Get('similar')
  public async getSimilarCategories(
    @Query() name: string, @Res() validationError: TsoaResponse<400, APIError>,
  ): Promise<CategoryResponse[]> {
    if (!isValidSimilarName(name)) {
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Invalid value for name: it must be a non-empty text'))
    }
    return this.categoryService.getSimilar(name)
  }

  /** @summary Gets a category by name */
  @Get('{name}')
  public async getCategory(@Path() name: string, @Res() notFound: TsoaResponse<404, APIError>): Promise<CategoryResponse> {
    const data = await this.categoryService.get(name)
    if (!data) {
      return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Category not found'))
    }
    return data
  }

  /** @summary Creates a category; 422 when an attribute does not exist */
  @Post()
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @SuccessResponse(201, 'Category created')
  public async createCategory(
    @Body() input: CategoryInput,
    @Res() validationError: TsoaResponse<400, APIError>,
    @Res() unprocessable: TsoaResponse<422, APIError>,
  ): Promise<CategoryResponse> {
    if (!input.name) {
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required field: name'))
    }
    if (!isValidAttributeIds(input.attributeIds)) {
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, INVALID_ATTRIBUTE_IDS_MESSAGE))
    }

    try {
      const data = await this.categoryService.create(input)
      this.setStatus(201)
      return data
    } catch (error) {
      if (error instanceof UnknownResource) {
        return unprocessable(422, NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      throw error
    }
  }

  /** @summary Changes a category; an empty name keeps the current one, 422 when the name is taken or an attribute does not exist */
  @Put('{name}')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  public async updateCategory(
    @Path() name: string,
    @Body() input: CategoryInput,
    @Res() validationError: TsoaResponse<400, APIError>,
    @Res() notFound: TsoaResponse<404, APIError>,
    @Res() unprocessable: TsoaResponse<422, APIError>,
  ): Promise<CategoryResponse> {
    // Prevent updating to an empty name
    const changes = isEmpty(input.name?.trim()) ? { ...input, name } : input
    if (!isValidAttributeIds(changes.attributeIds)) {
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, INVALID_ATTRIBUTE_IDS_MESSAGE))
    }

    try {
      const data = await this.categoryService.update(name, changes)
      if (!data) {
        return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Category not found'))
      }
      return data
    } catch (error) {
      if (error instanceof ResourceAlreadyExists) {
        return unprocessable(422, NewApiError(ErrorCode.RESOURCE_ALREADY_EXISTS, 422, error.message))
      }
      if (error instanceof UnknownResource) {
        return unprocessable(422, NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      throw error
    }
  }

  /** @summary Deletes a category */
  @Delete('{name}')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @SuccessResponse(204, 'Category deleted')
  public async deleteCategory(@Path() name: string): Promise<void> {
    await this.categoryService.delete(name)
    this.setStatus(204)
  }
}
