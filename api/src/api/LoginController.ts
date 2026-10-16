import { Body, Controller, Post, Response, Route, SuccessResponse, Tags } from 'tsoa'
import UserService from '@/services/UserService'
import User, { UserTokenResponse } from '@/models/User'
import type { LoginInput, RegisterInput, UserResponse } from '@/models/User'
import APIError, { NewApiError } from '@/models/APIError'
import { InvalidCredentials } from '@/errors/InvalidCredentials'
import ErrorCode from '@/errors/ErrorCode'
import UserRole from '@/models/UserRole'
import { RequestRejected } from '@/errors/RequestRejected'
import {
  BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE, INVALID_CREDENTIALS_DESCRIPTION,
  INVALID_CREDENTIALS_EXAMPLE, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE, UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE,
} from '@/api/ApiDocumentation'
import type { RateLimitHeaders } from '@/api/ApiDocumentation'

/** Signs users in and creates accounts; the only operations that need no bearer token besides the health check. */
@Route('login')
@Tags('Login')
@Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
@Response<APIError, { [Header in keyof RateLimitHeaders]: RateLimitHeaders[Header] }>(
  429, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
)
@Response<APIError>(500, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE)
export class LoginController extends Controller {
  private userService = new UserService()

  /**
   * Signs in and returns a bearer token for the other endpoints.
   * @summary Signs in and returns a bearer token
   */
  @Post()
  @Response<APIError>(401, INVALID_CREDENTIALS_DESCRIPTION, INVALID_CREDENTIALS_EXAMPLE)
  public async login(@Body() credentials: LoginInput): Promise<UserTokenResponse> {
    const { username, password } = credentials
    if (!username || !password) {
      throw new RequestRejected(NewApiError(ErrorCode.MISSING_CREDENTIALS, 400, 'Username and password are required'))
    }

    try {
      return await this.userService.login(username, password)
    } catch (error) {
      if (error instanceof InvalidCredentials) {
        throw new RequestRejected(NewApiError(ErrorCode.INVALID_CREDENTIALS, 401, 'Invalid username or password'))
      }
      throw error
    }
  }

  /**
   * Creates an account with the user role; 400 when a field is missing and 422 when the username is taken.
   * @summary Creates an account
   */
  @Post('register')
  @SuccessResponse(201, 'Account created')
  @Response<APIError>(422, UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE)
  public async register(@Body() input: RegisterInput): Promise<UserResponse> {
    const { username, email, password } = input
    if (!username || !email || !password) {
      throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required fields'))
    }

    const existingUser = await this.userService.getByUsername(username)
    if (existingUser) {
      throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_ALREADY_EXISTS, 422, 'Username already exists'))
    }

    const user = await this.userService.create({ username, email, password, roles: [UserRole.USER], ratedItems: [] } as Omit<User, 'id'>)

    // Never return password - destructure to omit password from response
    this.setStatus(201)
    return { ...user, password: undefined } as UserResponse
  }
}
