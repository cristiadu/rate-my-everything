import {
  Body, Controller, Delete, Get, Path, Post, Put, Response, Route, Security, SuccessResponse, Tags,
} from 'tsoa'
import UserService from '@/services/UserService'
import APIError, { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { RequestRejected } from '@/errors/RequestRejected'
import User from '@/models/User'
import type { UserInput, UserResponse, UserUpdate } from '@/models/User'
import UserRole from '@/models/UserRole'
import { BEARER_AUTH } from '@/helpers/Authentication'
import {
  BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE, INTERNAL_ERROR_DESCRIPTION,
  INTERNAL_ERROR_EXAMPLE, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
  UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE,
} from '@/api/ApiDocumentation'
import type { RateLimitHeaders } from '@/api/ApiDocumentation'
import type { ResourceId } from '@/models/ResourceId'

/** Removes the password hash so it is never sent in an API response. */
const withoutPassword = (user: User) => ({ ...user, password: undefined }) as UserResponse

/** Account management for admins. */
@Route('users')
@Tags('Users')
@Security(BEARER_AUTH, [UserRole.ADMIN])
@Response<APIError>(401, UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE)
@Response<APIError>(403, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE)
@Response<APIError, { [Header in keyof RateLimitHeaders]: RateLimitHeaders[Header] }>(
  429, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
)
@Response<APIError>(500, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE)
export class UserController extends Controller {
  private userService = new UserService()

  /** @summary Lists every user */
  @Get()
  public async getUsers(): Promise<UserResponse[]> {
    const data = await this.userService.getAll()
    return data.map(withoutPassword)
  }

  /**
   * @summary Finds a user by username
   * @param username Username to look for
   * @example username "ada"
   */
  @Get('username/{username}')
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  public async getUserByUsername(@Path() username: string): Promise<UserResponse> {
    const data = await this.userService.getByUsername(username)
    if (!data) {
      throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'User not found'))
    }
    return withoutPassword(data)
  }

  /**
   * @summary Gets a user
   * @param id Id of the user
   */
  @Get('{id}')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  public async getUser(@Path() id: ResourceId): Promise<UserResponse> {
    const data = await this.userService.getById(id)
    if (!data) {
      throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'User not found'))
    }
    return withoutPassword(data)
  }

  /** @summary Creates a user */
  @Post()
  @SuccessResponse(201, 'User created')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async createUser(@Body() input: UserInput): Promise<UserResponse> {
    const data = await this.userService.create(input as Omit<User, 'id'>)
    this.setStatus(201)
    return withoutPassword(data)
  }

  /**
   * @summary Changes a user; without a password, the current one is kept
   * @param id Id of the user
   */
  @Put('{id}')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  public async updateUser(@Path() id: ResourceId, @Body() input: UserUpdate): Promise<UserResponse> {
    const data = await this.userService.update(id, input)
    if (!data) {
      throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'User not found'))
    }
    return withoutPassword(data)
  }

  /**
   * @summary Deletes a user
   * @param id Id of the user
   */
  @Delete('{id}')
  @SuccessResponse(204, 'User deleted')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async deleteUser(@Path() id: ResourceId): Promise<void> {
    await this.userService.delete(id)
    this.setStatus(204)
  }
}
