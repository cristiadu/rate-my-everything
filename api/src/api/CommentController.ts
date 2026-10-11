import { Request, Response, Router } from 'express'
import CommentService from '@/services/CommentService'
import { MAX_COMMENT_LENGTH } from '@/models/Comment'
import { SessionUser } from '@/models/User'
import { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { UnknownItem } from '@/errors/UnknownItem'
import { CommentNotOwned } from '@/errors/CommentNotOwned'

/** Discussion threads on items: list an item's comments, post one, and delete one. */
export default class CommentController {
  public router = Router()

  private commentService = new CommentService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/item/:item_id', (req, res) => this.getAllByItemId(req, res))
    this.router.post('/', (req, res) => this.create(req, res))
    this.router.delete('/:id', (req, res) => this.delete(req, res))
  }

  /** Lists the comments on an item, oldest first. */
  public async getAllByItemId(req: Request, res: Response) {
    try {
      const data = await this.commentService.getAllByItemId(parseInt(req.params.item_id, 10))
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  /** Posts a comment by the signed-in user; 400 when item_id or the body is missing or too long, 404 for an unknown item. */
  public async create(req: Request, res: Response) {
    try {
      const { item_id, body } = req.body
      const trimmedBody = typeof body === 'string' ? body.trim() : ''
      if (!item_id || !trimmedBody) {
        return res.status(400).json(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required fields: item_id, body'))
      }
      if (trimmedBody.length > MAX_COMMENT_LENGTH) {
        const message = `Comment body must be at most ${MAX_COMMENT_LENGTH} characters`
        return res.status(400).json(NewApiError(ErrorCode.VALIDATION_ERROR, 400, message))
      }
      const sessionUser = res.locals.user as SessionUser
      const data = await this.commentService.create(item_id, sessionUser.id, trimmedBody)
      res.status(201).json(data)
    } catch (error) {
      if (error instanceof UnknownItem) {
        return res.status(404).json(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Item not found'))
      }
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }

  /** Deletes a comment; 403 unless the signed-in user wrote it or is an admin or moderator. */
  public async delete(req: Request, res: Response) {
    try {
      await this.commentService.delete(parseInt(req.params.id, 10), res.locals.user as SessionUser)
      res.status(204).json()
    } catch (error) {
      if (error instanceof CommentNotOwned) {
        return res.status(403).json(NewApiError(ErrorCode.FORBIDDEN, 403, error.message))
      }
      console.error(error)
      res.status(500).json(NewApiError(ErrorCode.INTERNAL_ERROR, 500, 'An internal server error occurred'))
    }
  }
}
