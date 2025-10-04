import { Request, Response, Router } from 'express'
import UserService from '@/services/UserService'

export default class UserController {
  public router = Router()

  private userService = new UserService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', this.getAll)
    this.router.get('/username/:username', this.getByUsername)
    this.router.get('/:id', this.getById)
    this.router.post('/', this.create)
    this.router.put('/:id', this.update)
    this.router.delete('/:id', this.delete)
    // Add more routes as needed
  }

  public async getAll(req: Request, res: Response) {
    // Implement the logic for getting all users
    try {
      const data = await this.userService.getAll()
      res.status(200).send(JSON.stringify(data))
    } catch (error) {
      console.error(error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async getByUsername(req: Request, res: Response) {
    try {
      const data = await this.userService.getByUsername(req.params.username)
      res.status(200).send(JSON.stringify(data))
    } catch (error) {
      console.error(error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const data = await this.userService.getById(parseInt(req.params.user_id, 10))
      res.status(200).send(JSON.stringify(data))
    } catch (error) {
      console.error(error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const data = await this.userService.create(req.body)
      res.status(201).send(JSON.stringify(data))
    } catch (error) {
      console.error(error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const data = await this.userService.update(parseInt(req.params.id, 10), req.body)
      if (data) {
        res.status(200).send(JSON.stringify(data))
      } else {
        res.status(404).send('Data not found')
      }
    } catch (error) {
      console.error(error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      await this.userService.delete(parseInt(req.params.id, 10))
      res.status(204).send()
    } catch (error) {
      console.error(error)
      res.status(500).send('An internal server error occurred')
    }
  }
}
