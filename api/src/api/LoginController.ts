import { Body, Controller, Middlewares, Post, Response, Route, SuccessResponse, Tags } from 'tsoa'
import UserService from '@/services/UserService'
import PasswordResetService from '@/services/PasswordResetService'
import User, { UserTokenResponse } from '@/models/User'
import type { LoginInput, RegisterInput, UserResponse } from '@/models/User'
import type { PasswordResetInput, PasswordResetRequest } from '@/models/PasswordReset'
import APIError, { NewApiError } from '@/models/APIError'
import { InvalidCredentials } from '@/errors/InvalidCredentials'
import { InvalidResetToken } from '@/errors/InvalidResetToken'
import { passwordResetLimiter } from '@/helpers/RateLimitHelper'
import ErrorCode from '@/errors/ErrorCode'
import UserRole from '@/models/UserRole'
import { RequestRejected } from '@/errors/RequestRejected'
import {
  BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE, INVALID_CREDENTIALS_DESCRIPTION,
  INVALID_CREDENTIALS_EXAMPLE, INVALID_RESET_TOKEN_DESCRIPTION, INVALID_RESET_TOKEN_EXAMPLE, TOO_MANY_REQUESTS_DESCRIPTION,
  TOO_MANY_REQUESTS_EXAMPLE, UNPROCESSABLE_DESCRIPTION, UNPROCESSABLE_EXAMPLE,
} from '@/api/ApiDocumentation'
import type { RateLimitHeaders } from '@/api/ApiDocumentation'

/**
 * Signs users in, creates accounts and resets forgotten passwords; the only operations that need no bearer token besides
 * the health check.
 */
@Route('login')
@Tags('Login')
@Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
@Response<APIError, { [Header in keyof RateLimitHeaders]: RateLimitHeaders[Header] }>(
  429, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
)
@Response<APIError>(500, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE)
export class LoginController extends Controller {
  private userService = new UserService()

  private passwordResetService = new PasswordResetService()

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

  /**
   * Emails a link to choose a new password to every account using the address. Always answers 204, whether or not an
   * account uses it, so the answer does not tell who has an account; the link works once, for one hour.
   * @summary Emails a password reset link
   */
  @Post('password-reset')
  @Middlewares(passwordResetLimiter)
  @SuccessResponse(204, 'Reset link sent if an account uses the address')
  public async requestPasswordReset(@Body() input: PasswordResetRequest): Promise<void> {
    if (!input.email) {
      throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Email is required'))
    }

    await this.passwordResetService.requestReset(input.email)
    this.setStatus(204)
  }

  /**
   * Sets a new password with the token from a reset link, which then stops working; 400 when the token is unknown,
   * already used or expired.
   * @summary Sets a new password from a reset link
   */
  @Post('password-reset/confirm')
  @SuccessResponse(204, 'Password changed')
  @Response<APIError>(400, INVALID_RESET_TOKEN_DESCRIPTION, INVALID_RESET_TOKEN_EXAMPLE)
  public async resetPassword(@Body() input: PasswordResetInput): Promise<void> {
    const { token, password } = input
    if (!token || !password) {
      throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Token and password are required'))
    }

    try {
      await this.passwordResetService.resetPassword(token, password)
    } catch (error) {
      if (error instanceof InvalidResetToken) {
        throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 400, error.message))
      }
      throw error
    }
    this.setStatus(204)
  }
}
