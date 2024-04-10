import { DBConnection } from '..'
import RatedItem from '../models/RatedItem'

// Method for CRUD of a RatedItem, which is a model for a rated item.
class RatedItemService {
  // Create a new RatedItem
  public async create(ratedItem: RatedItem): Promise<RatedItem> {
    const ratedItemRepository = DBConnection.getRepository(RatedItem)
    const newRatedItem = ratedItemRepository.create(ratedItem)
    return ratedItemRepository.save(newRatedItem)
  }

  // Read a RatedItem by id
  public async get(id: number): Promise<RatedItem | null> {
    const ratedItemRepository = DBConnection.getRepository(RatedItem)
    const ratedItem = await ratedItemRepository.findOne({ where: { id } })
    return ratedItem
  }

  // Update a RatedItem
  public async update(id: number, ratedItem: RatedItem): Promise<RatedItem | null> {
    const ratedItemRepository = DBConnection.getRepository(RatedItem)
    const updatedRatedItem = await ratedItemRepository.findOne({ where: { id } })
    if (updatedRatedItem) {
      ratedItemRepository.merge(updatedRatedItem, ratedItem)
      return ratedItemRepository.save(updatedRatedItem)
    }
    return null
  }

  // Delete a RatedItem
  public async delete(id: number): Promise<void> {
    // Implement the logic to delete a RatedItem
    const ratedItemRepository = DBConnection.getRepository(RatedItem)
    const ratedItem = await ratedItemRepository.findOne({ where: { id } })
    if (ratedItem) {
      await ratedItemRepository.remove(ratedItem)
    }
  }

  // get all RatedItems
  public async getAll(): Promise<RatedItem[]> {
    // Implement the logic to get all RatedItems
    const ratedItemRepository = DBConnection.getRepository(RatedItem)
    return ratedItemRepository.find()
  }

  // get all RatedItems by user_id
  public async getAllByUserId(user_id: number): Promise<RatedItem[]> {
    // Implement the logic to get all RatedItems by user_id
    const ratedItemRepository = DBConnection.getRepository(RatedItem)
    return ratedItemRepository.find({ where: { user_id } })
  }
}

export default RatedItemService
