import { Body, Controller, Post, Res, Response, Route, SuccessResponse, Tags } from 'tsoa'
import type { TsoaResponse } from 'tsoa'
import UserService from '@/services/UserService'
import User, { UserTokenResponse } from '@/models/User'
import type { LoginInput, RegisterInput, UserResponse } from '@/models/User'
import APIError, { NewApiError } from '@/models/APIError'
import { InvalidCredentials } from '@/errors/InvalidCredentials'
import ErrorCode from '@/errors/ErrorCode'

@Route('login')
@Tags('Login')
@Response<APIError>(500, 'Something unexpected failed')
export class LoginController extends Controller {
  private userService = new UserService()

  /**
   * Signs in and returns a bearer token for the other endpoints.
   * @summary Signs in and returns a bearer token
   */
  @Post()
  public async login(
    @Body() credentials: LoginInput,
    @Res() missingCredentials: TsoaResponse<400, APIError>,
    @Res() invalidCredentials: TsoaResponse<401, APIError>,
  ): Promise<UserTokenResponse> {
    const { username, password } = credentials
    if (!username || !password) {
      return missingCredentials(400, NewApiError(ErrorCode.MISSING_CREDENTIALS, 400, 'Username and password are required'))
    }

    try {
      return await this.userService.login(username, password)
    } catch (error) {
      if (error instanceof InvalidCredentials) {
        return invalidCredentials(401, NewApiError(ErrorCode.INVALID_CREDENTIALS, 401, 'Invalid username or password'))
      }
      throw error
    }
  }

  /**
   * Creates an account; 400 when a field is missing and 422 when the username is taken.
   * @summary Creates an account
   */
  @Post('register')
  @SuccessResponse(201, 'Account created')
  public async register(
    @Body() input: RegisterInput,
    @Res() validationError: TsoaResponse<400, APIError>,
    @Res() usernameTaken: TsoaResponse<422, APIError>,
  ): Promise<UserResponse> {
    const { username, email, password, roles } = input
    if (!username || !email || !password) {
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required fields'))
    }

    const existingUser = await this.userService.getByUsername(username)
    if (existingUser) {
      return usernameTaken(422, NewApiError(ErrorCode.RESOURCE_ALREADY_EXISTS, 422, 'Username already exists'))
    }

    const user = await this.userService.create({ username, email, password, roles: roles || [], ratedItems: [] } as Omit<User, 'id'>)

    // Never return password - destructure to omit password from response
    this.setStatus(201)
    return { ...user, password: undefined } as UserResponse
  }
}
