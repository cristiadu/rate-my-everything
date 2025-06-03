import RatedItem from '@/models/RatedItem'
import BaseService from '@/services/BaseService'

// Method for CRUD of a RatedItem, which is a model for a rated item.
class RatedItemService extends BaseService {
  constructor() {
    super(RatedItem)
  }

  // Create a new RatedItem
  public async create(ratedItem: RatedItem): Promise<RatedItem> {
    const newRatedItem = this.repository.create(ratedItem)
    return this.repository.save(newRatedItem)
  }

  // Read a RatedItem by id
  public async get(id: number): Promise<RatedItem | null> {
    const ratedItem = await this.repository.findOne({ where: { id } })
    return ratedItem
  }

  // Update a RatedItem
  public async update(id: number, ratedItem: RatedItem): Promise<RatedItem | null> {
    const updatedRatedItem = await this.get(id)
    if (updatedRatedItem) {
      this.repository.merge(updatedRatedItem, ratedItem)
      return this.repository.save(updatedRatedItem)
    }
    return null
  }

  // Delete a RatedItem
  public async delete(id: number): Promise<void> {
    const ratedItem = await this.get(id)
    if (ratedItem) {
      await this.repository.remove(ratedItem)
    }
  }

  // get all RatedItems
  public async getAll(): Promise<RatedItem[]> {
    return this.repository.find()
  }

  // get all RatedItems by user_id
  public async getAllByUserId(userId: number): Promise<RatedItem[]> {
    return this.repository.find({ where: { user: { id: userId } } })
  }
}

export default RatedItemService
