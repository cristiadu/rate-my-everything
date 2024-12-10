import { Request, Response, Router } from 'express'
import UserService from '../services/UserService'
import rateLimit from 'express-rate-limit'

export default class LoginController {
  public router = Router()

  private userService = new UserService()

  constructor() {
    this.login = this.login.bind(this)
    this.initializeRoutes()
  }

  public initializeRoutes() {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    })
    this.router.post('/', limiter, this.login)
    // Add more routes as needed
  }

  public async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body
      const jwtToken = await this.userService.login(username, password)
      if (jwtToken) {
        res.status(200).send(JSON.stringify({ token: jwtToken }))
      } else {
        res.status(401).send('Invalid username or password')
      }
    } catch (error) {
      console.error('Exception occurred:', error)
      res.status(500).send('An internal server error occurred')
    }
  }
}
