import { Request, Response, Router } from 'express'
import UserService from '@/services/UserService'
import User from '@/models/User'
import { NewApiError } from '@/models/APIError'
import { InvalidCredentials } from '@/errors/InvalidCredentials'

export default class LoginController {
  public router = Router()

  private userService = new UserService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.post('/', (req, res) => {
      this.login(req, res)
    })
    this.router.post('/register', (req, res) => {
      this.register(req, res)
    })
  }

  public async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body
      // Check for missing credentials
      if (!username || !password) {
        return res.status(400)
          .json(NewApiError('MISSING_CREDENTIALS', 400, 'Username and password are required'))
      }

      const result = await this.userService.login(username, password)
      if (result) {
        res.status(200)
          .json(result)
      } else {
        res.status(401)
          .json(NewApiError('INVALID_CREDENTIALS', 401, 'Invalid username or password'))
      }
    } catch (error) {
      if (error instanceof InvalidCredentials) {
        return res.status(401)
          .json(NewApiError('INVALID_CREDENTIALS', 401, 'Invalid username or password'))
      }

      console.error('Exception occurred:', error)
      res.status(500)
        .json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async register(req: Request, res: Response) {
    try {
      const { username, email, password, roles } = req.body
      if (!username || !email || !password) {
        return res.status(400)
          .json(NewApiError('MISSING_FIELDS', 400, 'Missing required fields'))
      }

      // Check if user already exists
      const existingUser = await this.userService.getByUsername(username)
      if (existingUser) {
        return res.status(422)
          .json(NewApiError('USER_ALREADY_EXISTS', 422, 'Username already exists'))
      }

      const userObj = {
        username,
        email,
        password,
        roles: roles || [],
        ratedItems: []
      } as Partial<User>

      // Using Omit<User, 'id'> since id is auto-generated
      const user = await this.userService.create(userObj as Omit<User, 'id'>)

      // Never return password - destructure to omit password from response
      const userSafe = { ...user, password: undefined }
      res.status(201)
        .json(userSafe)
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500)
        .json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }
}
