import RatedItem from '@/models/RatedItem'
import BaseService from '@/services/BaseService'

/** Relations returned with every rating so clients can show what was rated and its category. */
const RATING_RELATIONS = { item: { category: true } }

class RatedItemService extends BaseService<RatedItem> {
  constructor() {
    super(RatedItem)
  }

  /** Create a new RatedItem for the given item and user. */
  public async create(itemId: number, userId: number, rating: number, notes?: string): Promise<RatedItem> {
    const newRatedItem = this.repository.create({ item: { id: itemId }, user: { id: userId }, rating, notes })
    const savedRatedItem = await this.repository.save(newRatedItem)
    return this.repository.findOneOrFail({ where: { id: savedRatedItem.id }, relations: RATING_RELATIONS })
  }

  /** Read a RatedItem by id. */
  public async get(id: number): Promise<RatedItem | null> {
    const ratedItem = await this.repository.findOne({ where: { id }, relations: RATING_RELATIONS })
    return ratedItem
  }

  /** Update a RatedItem. */
  public async update(id: number, ratedItem: Omit<RatedItem, 'id'>): Promise<RatedItem | null> {
    const updatedRatedItem = await this.get(id)
    if (updatedRatedItem) {
      this.repository.merge(updatedRatedItem, ratedItem)
      return this.repository.save(updatedRatedItem)
    }
    return null
  }

  /** Delete a RatedItem. */
  public async delete(id: number): Promise<void> {
    const ratedItem = await this.get(id)
    if (ratedItem) {
      await this.repository.delete(ratedItem.id)
    }
  }

  /** Get all RatedItems. */
  public async getAll(): Promise<RatedItem[]> {
    return this.repository.find({ relations: RATING_RELATIONS })
  }

  /** Get every user's ratings of one item. */
  public async getAllByItemId(itemId: number): Promise<RatedItem[]> {
    return this.repository.find({ where: { item: { id: itemId } }, relations: RATING_RELATIONS })
  }

  /** Get all RatedItems by user_id. */
  public async getAllByUserId(userId: number): Promise<RatedItem[]> {
    return this.repository.find({ where: { user: { id: userId } }, relations: RATING_RELATIONS })
  }
}

export default RatedItemService
