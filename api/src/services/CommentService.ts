import Comment from '@/models/Comment'
import BaseService from '@/services/BaseService'
import ItemService from '@/services/ItemService'
import { SessionUser } from '@/models/User'
import UserRole from '@/models/UserRole'
import { UnknownItem } from '@/errors/UnknownItem'
import { CommentNotOwned } from '@/errors/CommentNotOwned'

/** Fields returned for every comment: its author is limited to id and username. */
const COMMENT_SELECT = { id: true, body: true, createdAt: true, item: { id: true }, user: { id: true, username: true } }

/** Roles that may delete any comment, not only their own. */
const MODERATING_ROLES = [UserRole.ADMIN, UserRole.MODERATOR]

/** Relations returned with every comment. */
const COMMENT_RELATIONS = { item: true, user: true }

class CommentService extends BaseService<Comment> {
  private itemService = new ItemService()

  constructor() {
    super(Comment)
  }

  /** Read a Comment by id. */
  public async get(id: number): Promise<Comment | null> {
    return this.repository.findOne({ where: { id }, select: COMMENT_SELECT, relations: COMMENT_RELATIONS })
  }

  /** Get the discussion of an item, oldest comment first. */
  public async getAllByItemId(itemId: number): Promise<Comment[]> {
    return this.repository.find({
      where: { item: { id: itemId } },
      select: COMMENT_SELECT,
      relations: COMMENT_RELATIONS,
      order: { createdAt: 'ASC', id: 'ASC' },
    })
  }

  /** Add a comment by the given user to the discussion of an item, failing when the item does not exist. */
  public async create(itemId: number, userId: number, body: string): Promise<Comment> {
    if (!await this.itemService.get(itemId)) {
      throw new UnknownItem(itemId)
    }
    const savedComment = await this.repository.save(this.repository.create({ item: { id: itemId }, user: { id: userId }, body }))
    return this.repository.findOneOrFail({ where: { id: savedComment.id }, select: COMMENT_SELECT, relations: COMMENT_RELATIONS })
  }

  /** Delete a Comment as the given user, who must be its author or a moderator; a missing comment is ignored. */
  public async delete(id: number, sessionUser: SessionUser): Promise<void> {
    const comment = await this.get(id)
    if (!comment) {
      return
    }
    const isModerator = sessionUser.roles.some((role) => MODERATING_ROLES.includes(role))
    if (comment.user.id !== sessionUser.id && !isModerator) {
      throw new CommentNotOwned(id)
    }
    await this.repository.delete(id)
  }
}

export default CommentService
