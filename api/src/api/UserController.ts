import {
  Body, Controller, Delete, Get, Path, Post, Put, Res, Response, Route, Security, SuccessResponse, Tags,
} from 'tsoa'
import type { TsoaResponse } from 'tsoa'
import UserService from '@/services/UserService'
import APIError, { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import User from '@/models/User'
import type { UserInput, UserResponse } from '@/models/User'
import UserRole from '@/models/UserRole'
import { BEARER_AUTH } from '@/helpers/Authentication'

/** Removes the password hash so it is never sent in an API response. */
const withoutPassword = (user: User) => ({ ...user, password: undefined }) as UserResponse

@Route('users')
@Tags('Users')
@Security(BEARER_AUTH, [UserRole.ADMIN])
@Response<APIError>(401, 'The bearer token is missing or invalid')
@Response<APIError>(403, 'The signed-in user may not call this operation')
@Response<APIError>(500, 'Something unexpected failed')
export class UserController extends Controller {
  private userService = new UserService()

  /** @summary Lists every user */
  @Get()
  public async getUsers(): Promise<UserResponse[]> {
    const data = await this.userService.getAll()
    return data.map(withoutPassword)
  }

  /** @summary Finds a user by username */
  @Get('username/{username}')
  public async getUserByUsername(@Path() username: string, @Res() notFound: TsoaResponse<404, APIError>): Promise<UserResponse> {
    const data = await this.userService.getByUsername(username)
    if (!data) {
      return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'User not found'))
    }
    return withoutPassword(data)
  }

  /** @summary Gets a user */
  @Get('{id}')
  public async getUser(@Path() id: number, @Res() notFound: TsoaResponse<404, APIError>): Promise<UserResponse> {
    const data = await this.userService.getById(id)
    if (!data) {
      return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'User not found'))
    }
    return withoutPassword(data)
  }

  /** @summary Creates a user */
  @Post()
  @SuccessResponse(201, 'User created')
  public async createUser(@Body() input: UserInput): Promise<UserResponse> {
    const data = await this.userService.create(input as Omit<User, 'id'>)
    this.setStatus(201)
    return withoutPassword(data)
  }

  /** @summary Changes a user; without a password, the current one is kept */
  @Put('{id}')
  public async updateUser(
    @Path() id: number, @Body() input: Partial<UserInput>, @Res() notFound: TsoaResponse<404, APIError>,
  ): Promise<UserResponse> {
    const data = await this.userService.update(id, input)
    if (!data) {
      return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'User not found'))
    }
    return withoutPassword(data)
  }

  /** @summary Deletes a user */
  @Delete('{id}')
  @SuccessResponse(204, 'User deleted')
  public async deleteUser(@Path() id: number): Promise<void> {
    await this.userService.delete(id)
    this.setStatus(204)
  }
}
