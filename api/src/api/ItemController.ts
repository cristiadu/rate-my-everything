import { Request, Response, Router } from 'express'
import ItemService from '@/services/ItemService'

export default class ItemController {
  public router = Router()

  private itemService = new ItemService()

  constructor() {
    this.getAll = this.getAll.bind(this)
    this.getAllByCategory = this.getAllByCategory.bind(this)
    this.getById = this.getById.bind(this)
    this.create = this.create.bind(this)
    this.update = this.update.bind(this)
    this.delete = this.delete.bind(this)
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', this.getAll)
    this.router.get('/category/:category', this.getAllByCategory)
    this.router.get('/:id', this.getById)
    this.router.post('/', this.create)
    this.router.put('/:id', this.update)
    this.router.delete('/:id', this.delete)
    // Add more routes as needed
  }

  public async getAll(req: Request, res: Response) {
    try {
      const data = await this.itemService.getAll()
      res.status(200).send(JSON.stringify(data))
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async getAllByCategory(req: Request, res: Response) {
    try {
      const data = await this.itemService.getAllByCategory(req.params.category)
      res.status(200).send(JSON.stringify(data))
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const data = await this.itemService.get(parseInt(req.params.id, 10))
      if (data) {
        res.status(200).send(JSON.stringify(data))
      } else {
        res.status(404).send('Data not found')
      }
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const data = await this.itemService.create(req.body)
      res.status(201).send(JSON.stringify(data))
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const data = await this.itemService.update(parseInt(req.params.id, 10), req.body)
      if (data) {
        res.status(200).send(JSON.stringify(data))
      } else {
        res.status(404).send('Data not found')
      }
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      await this.itemService.delete(parseInt(req.params.id, 10))
      res.status(204).send()
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).send('An internal server error occurred')
    }
  }
}
