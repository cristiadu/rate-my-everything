import { Request, Response, Router } from 'express'
import RatedItemService from '@/services/RatedItemService'
import { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import RatedItem from '@/models/RatedItem'
import { SessionUser } from '@/models/User'

export default class RatedItemController {
  public router = Router()

  private ratedItemService = new RatedItemService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', (req, res) => this.getAll(req, res))
    this.router.get('/user/:user_id', (req, res) => this.getAllByUserId(req, res))
    this.router.get('/item/:item_id', (req, res) => this.getAllByItemId(req, res))
    this.router.get('/mine', (req, res) => this.getMine(req, res))
    this.router.get('/:id', (req, res) => this.getById(req, res))
    this.router.post('/', (req, res) => this.create(req, res))
    this.router.put('/:id', (req, res) => this.update(req, res))
    this.router.delete('/:id', (req, res) => this.delete(req, res))
    // Add more routes as needed
  }

  public async getAll(_req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.getAll()
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  public async getAllByUserId(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.getAllByUserId(parseInt(req.params.user_id, 10))
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  /** Lists every user's ratings of one item, used to work out its collective grade. */
  public async getAllByItemId(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.getAllByItemId(parseInt(req.params.item_id, 10))
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  /** Lists the signed-in user's ratings, each with its item and category. */
  public async getMine(_req: Request, res: Response) {
    try {
      const sessionUser = res.locals.user as SessionUser
      const data = await this.ratedItemService.getAllByUserId(sessionUser.id)
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const data = await this.ratedItemService.get(parseInt(req.params.id, 10))
      if (data) {
        res.status(200).json(data)
      } else {
        res.status(404).json(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Rated item not found'))
      }
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  /** Creates a rating of an item for the signed-in user; 400 when item_id or a numeric rating is missing. */
  public async create(req: Request, res: Response) {
    try {
      const { item_id, rating, notes } = req.body
      if (!item_id || typeof rating !== 'number') {
        return res.status(400).json(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required fields: item_id, rating'))
      }
      const sessionUser = res.locals.user as SessionUser
      const data = await this.ratedItemService.create(item_id, sessionUser.id, rating, notes)
      res.status(201).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const ratedItemBody = req.body as RatedItem
      const data = await this.ratedItemService.update(parseInt(req.params.id, 10), ratedItemBody)
      if (data) {
        res.status(200).json(data)
      } else {
        res.status(404).json(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Rated item not found'))
      }
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      await this.ratedItemService.delete(parseInt(req.params.id, 10))
      res.status(204).json()
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }
}
