import { Request, Response, Router } from 'express'
import ItemService from '@/services/ItemService'
import { ItemInput } from '@/models/Item'
import { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { UnknownAttributes } from '@/errors/UnknownAttributes'
import { UnknownResource } from '@/errors/UnknownResource'
import { isValidSimilarName } from '@/helpers/SimilarityHelper'

export default class ItemController {
  public router = Router()

  private itemService = new ItemService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', (req, res) => this.getAll(req, res))
    this.router.get('/category/:category', (req, res) => this.getAllByCategory(req, res))
    this.router.get('/similar', (req, res) => this.getSimilar(req, res))
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
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  public async getAllByCategory(req: Request, res: Response) {
    try {
      const data = await this.itemService.getAllByCategory(req.params.category)
      res.status(200).json(data)
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  /**
   * Lists the items whose name is likely a duplicate of ?name=, most similar first, only in ?categoryId= when sent;
   * 400 when name is empty or categoryId is not an integer.
   */
  public async getSimilar(req: Request, res: Response) {
    const { name, categoryId } = req.query
    if (!isValidSimilarName(name)) {
      return res.status(400).json(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Invalid value for name: it must be a non-empty text'))
    }
    const categoryIdNumber = categoryId === undefined ? undefined : Number(categoryId)
    if (categoryIdNumber !== undefined && !Number.isInteger(categoryIdNumber)) {
      return res.status(400).json(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Invalid value for categoryId: it must be an integer'))
    }

    try {
      res.status(200).json(await this.itemService.getSimilar(name, categoryIdNumber))
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const data = await this.itemService.get(parseInt(req.params.id, 10))
      if (data) {
        res.status(200).json(data)
      } else {
        res.status(404).json(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Item not found'))
      }
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  /** Creates an item with its attribute values; 400 when name or categoryId is missing, 422 for an unknown category or attribute. */
  public async create(req: Request, res: Response) {
    try {
      const itemInput = req.body as ItemInput
      if (!itemInput.name || itemInput.categoryId === undefined) {
        return res.status(400).json(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required fields: name, categoryId'))
      }
      const data = await this.itemService.create(itemInput)
      res.status(201).json(data)
    } catch (error) {
      if (error instanceof UnknownAttributes || error instanceof UnknownResource) {
        return res.status(422).json(NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      console.error((error as Error).stack || error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  /** Updates the fields sent for an item; 404 when it does not exist, 422 for an unknown category or attribute. */
  public async update(req: Request, res: Response) {
    try {
      const data = await this.itemService.update(parseInt(req.params.id, 10), req.body as ItemInput)
      if (data) {
        res.status(200).json(data)
      } else {
        res.status(404).json(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Item not found'))
      }
    } catch (error) {
      if (error instanceof UnknownAttributes || error instanceof UnknownResource) {
        return res.status(422).json(NewApiError(ErrorCode.VALIDATION_ERROR, 422, error.message))
      }
      console.error((error as Error).stack || error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      await this.itemService.delete(parseInt(req.params.id, 10))
      res.status(204).json()
    } catch (error) {
      console.error((error as Error).stack || error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }
}
