import { Request, Response, Router } from 'express'
import RatedItemService from '../services/RatedItemService'

export default class RatedItemController {
  public router = Router()

  private ratedItemService = new RatedItemService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', this.getAll)
    this.router.get('/:id', this.getById)
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

  public async getById(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.get(req.params.id)
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
}
