import { Request, Response, Router } from 'express'
import RatedItemService from '@/services/RatedItemService'
import { NewApiError } from '@/models/APIError'

export default class RatedItemController {
  public router = Router()

  private ratedItemService = new RatedItemService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', (req, res) => this.getAll(req, res))
    this.router.get('/user/:user_id', (req, res) => this.getAllByUserId(req, res))
    this.router.get('/:id', (req, res) => this.getById(req, res))
    this.router.post('/', (req, res) => this.create(req, res))
    this.router.put('/:id', (req, res) => this.update(req, res))
    this.router.delete('/:id', (req, res) => this.delete(req, res))
    // Add more routes as needed
  }

  public async getAll(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.getAll()
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async getAllByUserId(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.getAllByUserId(parseInt(req.params.user_id, 10))
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.get(parseInt(req.params.id, 10))
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

  public async create(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.create(req.body)
      res.status(201).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.update(parseInt(req.params.id, 10), req.body)
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
      await this.ratedItemService.delete(parseInt(req.params.id, 10))
      res.status(204).send()
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }
}
