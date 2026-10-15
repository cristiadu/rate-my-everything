import { FindOptionsSelect } from 'typeorm'
import ChangeRequest, { ChangeRequestInput, ChangeRequestReview } from '@/models/ChangeRequest'
import ChangeRequestAction from '@/models/ChangeRequestAction'
import ChangeRequestStatus from '@/models/ChangeRequestStatus'
import ChangeRequestTarget from '@/models/ChangeRequestTarget'
import { CategoryInput } from '@/models/Category'
import { ItemInput } from '@/models/Item'
import BaseService from '@/services/BaseService'
import CategoryService from '@/services/CategoryService'
import ItemService from '@/services/ItemService'
import { pickChanges } from '@/helpers/ChangeRequestHelper'
import { UnknownResource } from '@/errors/UnknownResource'
import { ChangeRequestNotPending } from '@/errors/ChangeRequestNotPending'

/** Columns returned with every change request; users are reduced to their id and username. */
const CHANGE_REQUEST_SELECT: FindOptionsSelect<ChangeRequest> = {
  id: true,
  targetType: true,
  action: true,
  targetId: true,
  targetName: true,
  changes: true,
  status: true,
  reviewNote: true,
  createdAt: true,
  reviewedAt: true,
  requestedBy: { id: true, username: true },
  reviewedBy: { id: true, username: true },
}

/** Relations returned with every change request. */
const CHANGE_REQUEST_RELATIONS = { requestedBy: true, reviewedBy: true }

class ChangeRequestService extends BaseService<ChangeRequest> {
  private itemService = new ItemService()

  private categoryService = new CategoryService()

  constructor() {
    super(ChangeRequest)
  }

  /** Name of the item or category the request is about, failing when an existing target is missing. */
  private async findTargetName({ targetType, action, targetId, changes }: ChangeRequestInput): Promise<string | null> {
    if (action === ChangeRequestAction.CREATE) {
      return changes?.name ?? null
    }
    const target = targetType === ChangeRequestTarget.ITEM
      ? await this.itemService.get(targetId as number)
      : await this.categoryService.getById(targetId as number)
    if (!target) {
      throw new UnknownResource(targetType, targetId)
    }
    return target.name
  }

  /** Saves a pending change request from the given user; nothing changes until a moderator approves it. */
  public async create(requesterId: number, input: ChangeRequestInput): Promise<ChangeRequest> {
    const { targetType, action, targetId } = input
    const newRequest = this.repository.create({
      targetType,
      action,
      targetId: action === ChangeRequestAction.CREATE ? null : targetId,
      targetName: await this.findTargetName(input),
      changes: action === ChangeRequestAction.DELETE ? null : pickChanges(targetType, input.changes),
      requestedBy: { id: requesterId },
    })
    const savedRequest = await this.repository.save(newRequest)
    return this.getByIdOrFail(savedRequest.id)
  }

  /** Reads a change request by id. */
  public async getById(id: number): Promise<ChangeRequest | null> {
    return this.repository.findOne({ where: { id }, select: CHANGE_REQUEST_SELECT, relations: CHANGE_REQUEST_RELATIONS })
  }

  /** Reads a change request that is known to exist. */
  private async getByIdOrFail(id: number): Promise<ChangeRequest> {
    return this.repository.findOneOrFail({ where: { id }, select: CHANGE_REQUEST_SELECT, relations: CHANGE_REQUEST_RELATIONS })
  }

  /** Lists the change requests a user submitted, newest first. */
  public async getAllByRequester(requesterId: number): Promise<ChangeRequest[]> {
    return this.repository.find({
      where: { requestedBy: { id: requesterId } },
      select: CHANGE_REQUEST_SELECT,
      relations: CHANGE_REQUEST_RELATIONS,
      order: { createdAt: 'DESC', id: 'DESC' },
    })
  }

  /** Lists every change request, optionally only those with one status, newest first. */
  public async getAll(status?: ChangeRequestStatus): Promise<ChangeRequest[]> {
    return this.repository.find({
      where: status ? { status } : {},
      select: CHANGE_REQUEST_SELECT,
      relations: CHANGE_REQUEST_RELATIONS,
      order: { createdAt: 'DESC', id: 'DESC' },
    })
  }

  /** Reads a change request for review, failing when it was already reviewed. */
  private async getPending(id: number): Promise<ChangeRequest | null> {
    const changeRequest = await this.getById(id)
    if (changeRequest && changeRequest.status !== ChangeRequestStatus.PENDING) {
      throw new ChangeRequestNotPending(id, changeRequest.status)
    }
    return changeRequest
  }

  /** Applies a request's changes through the items or categories service, failing when its target is gone. */
  private async applyChanges({ targetType, action, targetId, changes }: ChangeRequest): Promise<void> {
    if (targetType === ChangeRequestTarget.ITEM) {
      const updatedItem = await this.itemService.update(targetId as number, changes as ItemInput)
      if (!updatedItem) {
        throw new UnknownResource(targetType, targetId ?? undefined)
      }
      return
    }

    if (action === ChangeRequestAction.CREATE) {
      await this.categoryService.create(changes as CategoryInput)
      return
    }
    const category = await this.categoryService.getById(targetId as number)
    if (!category) {
      throw new UnknownResource(targetType, targetId ?? undefined)
    }
    if (action === ChangeRequestAction.UPDATE) {
      await this.categoryService.update(category.name, changes as CategoryInput)
    } else {
      await this.categoryService.delete(category.name)
    }
  }

  /** Records the moderator's decision on a change request and returns it. */
  private async recordReview(
    id: number, status: ChangeRequestStatus, reviewerId: number, { reviewNote }: ChangeRequestReview,
  ): Promise<ChangeRequest> {
    await this.repository.update(id, {
      status, reviewedBy: { id: reviewerId }, reviewNote: reviewNote || null, reviewedAt: new Date(),
    })
    return this.getByIdOrFail(id)
  }

  /** Applies a pending change request and marks it approved; null when it does not exist. */
  public async approve(id: number, reviewerId: number, review: ChangeRequestReview): Promise<ChangeRequest | null> {
    const changeRequest = await this.getPending(id)
    if (!changeRequest) {
      return null
    }
    await this.applyChanges(changeRequest)
    return this.recordReview(id, ChangeRequestStatus.APPROVED, reviewerId, review)
  }

  /** Marks a pending change request rejected without changing anything else; null when it does not exist. */
  public async reject(id: number, reviewerId: number, review: ChangeRequestReview): Promise<ChangeRequest | null> {
    const changeRequest = await this.getPending(id)
    if (!changeRequest) {
      return null
    }
    return this.recordReview(id, ChangeRequestStatus.REJECTED, reviewerId, review)
  }
}

export default ChangeRequestService
