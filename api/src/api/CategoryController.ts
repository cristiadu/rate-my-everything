import {
  Body, Controller, Delete, Get, Path, Post, Put, Query, Response, Route, Security, SuccessResponse, Tags,
} from 'tsoa'
import CategoryService from '@/services/CategoryService'
import APIError, { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { RequestRejected } from '@/errors/RequestRejected'
import type { CategoryInput, CategoryResponse } from '@/models/Category'
import UserRole from '@/models/UserRole'
import { isEmpty } from 'class-validator'
import { ResourceAlreadyExists } from '@/errors/ResourceAlreadyExists'
import { UnknownResource } from '@/errors/UnknownResource'
import { isValidSimilarName } from '@/helpers/SimilarityHelper'
import { BEARER_AUTH } from '@/helpers/Authentication'
import {
  BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE, INTERNAL_ERROR_DESCRIPTION,
  INTERNAL_ERROR_EXAMPLE, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
  UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE, UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE,
} from '@/api/ApiDocumentation'
import type { RateLimitHeaders } from '@/api/ApiDocumentation'

/** Categories group items and list the attributes that describe them; users read them and admins change them. */
@Route('categories')
@Tags('Categories')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])
@Response<APIError>(401, UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE)
@Response<APIError>(403, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE)
@Response<APIError, { [Header in keyof RateLimitHeaders]: RateLimitHeaders[Header] }>(
  429, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
)
@Response<APIError>(500, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE)
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
   * @example name "Boardgames"
   */
  @Get('similar')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async getSimilarCategories(@Query() name: string): Promise<CategoryResponse[]> {
    if (!isValidSimilarName(name)) {
      throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Invalid value for name: it must be a non-empty text'))
    }
    return this.categoryService.getSimilar(name)
  }

  /**
   * @summary Gets a category by name
   * @param name Name of the category
   * @example name "Books"
   */
  @Get('{name}')
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  public async getCategory(@Path() name: string): Promise<CategoryResponse> {
    const data = await this.categoryService.get(name)
    if (!data) {
      throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Category not found'))
    }
    return data
  }

  /** @summary Creates a category; 422 when an attribute does not exist */
  @Post()
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @SuccessResponse(201, 'Category created')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(422, UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE)
  public async createCategory(@Body() input: CategoryInput): Promise<CategoryResponse> {
    if (!input.name) {
      throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required field: name'))
    }

    try {
      const data = await this.categoryService.create(input)
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
   * @summary Changes a category; an empty name keeps the current one, 422 when the name is taken or an attribute does not exist
   * @param name Current name of the category
   * @example name "Books"
   */
  @Put('{name}')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  @Response<APIError>(422, UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE)
  public async updateCategory(@Path() name: string, @Body() input: CategoryInput): Promise<CategoryResponse> {
    // Prevent updating to an empty name
    const changes = isEmpty(input.name?.trim()) ? { ...input, name } : input

    try {
      const data = await this.categoryService.update(name, changes)
      if (!data) {
        throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Category not found'))
      }
      return data
    } catch (error) {
      if (error instanceof ResourceAlreadyExists) {
        throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_ALREADY_EXISTS, 422, error.message))
      }
      if (error instanceof UnknownResource) {
        throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      throw error
    }
  }

  /**
   * @summary Deletes a category
   * @param name Name of the category
   * @example name "Books"
   */
  @Delete('{name}')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @SuccessResponse(204, 'Category deleted')
  public async deleteCategory(@Path() name: string): Promise<void> {
    await this.categoryService.delete(name)
    this.setStatus(204)
  }
}
