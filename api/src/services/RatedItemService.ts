import { DBConnection } from '..'
import RatedItem from '../models/RatedItem'

// Method for CRUD of a RatedItem, which is a model for a rated item.
class RatedItemService {
  private ratedItemRepository

  constructor() {
    this.ratedItemRepository = DBConnection.getRepository(RatedItem)
  }

  // Create a new RatedItem
  public async create(ratedItem: RatedItem): Promise<RatedItem> {
    const newRatedItem = this.ratedItemRepository.create(ratedItem)
    return this.ratedItemRepository.save(newRatedItem)
  }

  // Read a RatedItem by id
  public async get(id: number): Promise<RatedItem | null> {
    const ratedItem = await this.ratedItemRepository.findOne({ where: { id } })
    return ratedItem
  }

  // Update a RatedItem
  public async update(id: number, ratedItem: RatedItem): Promise<RatedItem | null> {
    const updatedRatedItem = await this.get(id)
    if (updatedRatedItem) {
      this.ratedItemRepository.merge(updatedRatedItem, ratedItem)
      return this.ratedItemRepository.save(updatedRatedItem)
    }
    return null
  }

  // Delete a RatedItem
  public async delete(id: number): Promise<void> {
    const ratedItem = await this.get(id)
    if (ratedItem) {
      await this.ratedItemRepository.remove(ratedItem)
    }
  }

  // get all RatedItems
  public async getAll(): Promise<RatedItem[]> {
    return this.ratedItemRepository.find()
  }

  // get all RatedItems by user_id
  public async getAllByUserId(user_id: number): Promise<RatedItem[]> {
    return this.ratedItemRepository.find({ where: { user: { id: user_id } } })
  }
}

export default RatedItemService
