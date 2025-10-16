import { Request, Response, Router } from 'express'
import UserService from '@/services/UserService'
import User from '@/models/User'

export default class LoginController {
  public router = Router()

  private userService = new UserService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.post('/', this.login)
    this.router.post('/register', (req, res) => {
      this.register(req, res)
    })
  }

  public async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body
      const jwtToken = await this.userService.login(username, password)
      if (jwtToken) {
        res.status(200).json({ token: jwtToken })
      } else {
        res.status(401).json({ error: 'Invalid username or password' })
      }
    } catch (error) {
      console.error('Exception occurred:', error)
      res.status(500).json({ error: 'An internal server error occurred' })
    }
  }

  public async register(req: Request, res: Response) {
    try {
      const { username, email, password, roles } = req.body
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Check if user already exists
      const existingUser = await this.userService.getByUsername(username)
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' })
      }

      const userObj = {
        username,
        email,
        password,
        roles: roles || [],
        ratedItems: []
      }
      
      // Using Omit<User, 'id'> since id is auto-generated
      const user = await this.userService.create(userObj as Omit<User, 'id'>)
      
      // Never return password - destructure to omit password from response
      const userSafe = { ...user, password: undefined }
      res.status(201).json(userSafe)
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({ error: 'An internal server error occurred' })
    }
  }
}
