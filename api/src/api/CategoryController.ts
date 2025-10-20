import { Request, Response, Router } from 'express'
import CategoryService from '@/services/CategoryService'
import { NewApiError } from '@/models/APIError'

export default class CategoryController {
  public router = Router()

  private categoryService = new CategoryService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', (req, res) => this.getAll(req, res))
    this.router.get('/:name', (req, res) => this.getByName(req, res))
    this.router.post('/', (req, res) => this.create(req, res))
    this.router.put('/:id', (req, res) => this.update(req, res))
    this.router.delete('/:id', (req, res) => this.delete(req, res))
    // Add more routes as needed
  }

  public async getAll(req: Request, res: Response) {
    try {
      const data = await this.categoryService.getAll()
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async getByName(req: Request, res: Response) {
    try {
      const data = await this.categoryService.get(req.params.name)
      if (!data) {
        return res.status(404).json(NewApiError('RESOURCE_NOT_FOUND', 404, 'Category not found'))
      }
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const data = await this.categoryService.create(req.body)
      res.status(201).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const data = await this.categoryService.update(req.params.name, req.body)
      if (data) {
        res.status(200).json(data)
      } else {
        res.status(404).json(NewApiError('RESOURCE_NOT_FOUND', 404, 'Category not found'))
      }
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      await this.categoryService.delete(req.params.name)
      res.status(204).json({})
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }
}
