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
  public async get(id: string): Promise<RatedItem | null> {
    const ratedItemRepository = DBConnection.getRepository(RatedItem)
    const ratedItem = await ratedItemRepository.findOne({ where: { id: parseInt(id, 10) } })
    return ratedItem
  }

  // Update a RatedItem
  public async update(id: string, ratedItem: RatedItem): Promise<RatedItem | null> {
    const ratedItemRepository = DBConnection.getRepository(RatedItem)
    const updatedRatedItem = await ratedItemRepository.findOne({ where: { id: parseInt(id, 10) } })
    if (updatedRatedItem) {
      ratedItemRepository.merge(updatedRatedItem, ratedItem)
      return ratedItemRepository.save(updatedRatedItem)
    }
    return null
  }

  // Delete a RatedItem
  public async delete(id: string): Promise<void> {
    // Implement the logic to delete a RatedItem
    const ratedItemRepository = DBConnection.getRepository(RatedItem)
    const ratedItem = await ratedItemRepository.findOne({ where: { id: parseInt(id, 10) } })
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
}

export default RatedItemService
