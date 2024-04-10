import { Request, Response, Router } from 'express'
import RatedItemService from '../services/RatedItemService'

export default class RatedItemController {
  public router = Router()

  private ratedItemService = new RatedItemService()

  constructor() {
    this.getAll = this.getAll.bind(this)
    this.getById = this.getById.bind(this)
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', this.getAll)
    this.router.get('/user/:user_id', this.getAllByUserId)
    this.router.get('/:id', this.getById)
    this.router.post('/', this.create)
    this.router.put('/:id', this.update)
    this.router.delete('/:id', this.delete)
    // Add more routes as needed
  }

  public async getAll(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.getAll()
      res.status(200).send(JSON.stringify(data))
    } catch (error) {
      console.error(error)
      res.status(500).send(error)
    }
  }

  public async getAllByUserId(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.getAllByUserId(parseInt(req.params.user_id, 10))
      res.status(200).send(JSON.stringify(data))
    } catch (error) {
      console.error(error)
      res.status(500).send(error)
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.get(parseInt(req.params.id, 10))
      if (data) {
        res.status(200).send(JSON.stringify(data))
      } else {
        res.status(404).send('Data not found')
      }
    } catch (error) {
      console.error(error)
      res.status(500).send(error)
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.create(req.body)
      res.status(201).send(JSON.stringify(data))
    } catch (error) {
      console.error(error)
      res.status(500).send(error)
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.update(parseInt(req.params.id, 10), req.body)
      if (data) {
        res.status(200).send(JSON.stringify(data))
      } else {
        res.status(404).send('Data not found')
      }
    } catch (error) {
      console.error(error)
      res.status(500).send(error)
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      await this.ratedItemService.delete(parseInt(req.params.id, 10))
      res.status(204).send()
    } catch (error) {
      console.error(error)
      res.status(500).send(error)
    }
  }
}
