import Item from '@/models/Item'
import BaseService from '@/services/BaseService'

// Method for CRUD of an Item, which is a model for an item.
class ItemService extends BaseService {
  constructor() {
    super(Item)
  }

  // Create a new Item
  public async create(item: Item): Promise<Item> {
    const newItem = this.repository.create(item)
    return this.repository.save(newItem)
  }

  // Read an Item by id
  public async get(id: number): Promise<Item | null> {
    const item = await this.repository.findOne({ where: { id } })
    return item
  }

  // Update an Item
  public async update(id: number, item: Item): Promise<Item | null> {
    const updatedItem = await this.get(id)
    if (updatedItem) {
      this.repository.merge(updatedItem, item)
      return this.repository.save(updatedItem)
    }
    return null
  }

  // Delete an Item
  public async delete(id: number): Promise<void> {
    const item = await this.get(id)
    if (item) {
      await this.repository.remove(item)
    }
  }

  // get all Items
  public async getAll(): Promise<Item[]> {
    return this.repository.find()
  }

  // get all Items by category
  public async getAllByCategory(category: string): Promise<Item[]> {
    return this.repository.find({ where: { category: { name: category } } })
  }
}

export default ItemService
