import { Request, Response, Router } from 'express'
import LoginService from '../services/LoginService'

export default class LoginController {
  public router = Router()

  private loginService = new LoginService()

  constructor() {
    this.login = this.login.bind(this)
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.post('/', this.login)
    // Add more routes as needed
  }

  public async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body
      const jwtToken = await this.loginService.login(username, password)
      if (jwtToken) {
        res.status(200).send(JSON.stringify({ token: jwtToken }))
      } else {
        res.status(401).send('Invalid username or password')
      }
    } catch (error) {
      console.error(error)
      res.status(500).send(error)
    }
  }
}
