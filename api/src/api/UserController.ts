import { Request, Response, Router } from 'express'
import UserService from '@/services/UserService'
import { NewApiError } from '@/models/APIError'

export default class UserController {
  public router = Router()

  private userService = new UserService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', (req, res) => this.getAll(req, res))
    this.router.get('/username/:username', (req, res) => this.getByUsername(req, res))
    this.router.get('/:id', (req, res) => this.getById(req, res))
    this.router.post('/', (req, res) => this.create(req, res))
    this.router.put('/:id', (req, res) => this.update(req, res))
    this.router.delete('/:id', (req, res) => this.delete(req, res))
    // Add more routes as needed
  }

  public async getAll(req: Request, res: Response) {
    // Implement the logic for getting all users
    try {
      const data = await this.userService.getAll()
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async getByUsername(req: Request, res: Response) {
    try {
      const data = await this.userService.getByUsername(req.params.username)
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const data = await this.userService.getById(parseInt(req.params.user_id, 10))
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const data = await this.userService.create(req.body)
      res.status(201).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const data = await this.userService.update(parseInt(req.params.id, 10), req.body)
      if (data) {
        res.status(200).json(data)
      } else {
        res.status(404).json(NewApiError('NOT_FOUND', 404, 'Data not found'))
      }
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      await this.userService.delete(parseInt(req.params.id, 10))
      res.status(204).send()
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }
}
