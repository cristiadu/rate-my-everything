import { Request, Response, Router } from 'express'
import ItemService from '@/services/ItemService'
import { NewApiError } from '@/models/APIError'

export default class ItemController {
  public router = Router()

  private itemService = new ItemService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', (req, res) => this.getAll(req, res))
    this.router.get('/category/:category', (req, res) => this.getAllByCategory(req, res))
    this.router.get('/:id', (req, res) => this.getById(req, res))
    this.router.post('/', (req, res) => this.create(req, res))
    this.router.put('/:id', (req, res) => this.update(req, res))
    this.router.delete('/:id', (req, res) => this.delete(req, res))
    // Add more routes as needed
  }

  public async getAll(req: Request, res: Response) {
    try {
      const data = await this.itemService.getAll()
      res.status(200).json(data)
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async getAllByCategory(req: Request, res: Response) {
    try {
      const data = await this.itemService.getAllByCategory(req.params.category)
      res.status(200).json(data)
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const data = await this.itemService.get(parseInt(req.params.id, 10))
      if (data) {
        res.status(200).json(data)
      } else {
        res.status(404).json(NewApiError('NOT_FOUND', 404, 'Item not found'))
      }
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const { name, category } = req.body
      if (!name || !category) {
        return res.status(400).json(NewApiError('VALIDATION_ERROR', 400, 'Missing required fields: name, category'))
      }
      const data = await this.itemService.create(req.body)
      res.status(201).json(data)
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const { name, category } = req.body
      if (!name || !category) {
        return res.status(400).json(NewApiError('VALIDATION_ERROR', 400, 'Missing required fields: name, category'))
      }
      const data = await this.itemService.update(parseInt(req.params.id, 10), req.body)
      if (data) {
        res.status(200).json(data)
      } else {
        res.status(404).json(NewApiError('NOT_FOUND', 404, 'Item not found'))
      }
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      await this.itemService.delete(parseInt(req.params.id, 10))
      res.status(204).json()
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }
}
