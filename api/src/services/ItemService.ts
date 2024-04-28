import { DBConnection } from '..'
import Item from '../models/Item'

// Method for CRUD of an Item, which is a model for an item.
class ItemService {
  private itemRepository

  constructor() {
    this.itemRepository = DBConnection.getRepository(Item)
  }

  // Create a new Item
  public async create(item: Item): Promise<Item> {
    const newItem = this.itemRepository.create(item)
    return this.itemRepository.save(newItem)
  }

  // Read an Item by id
  public async get(id: number): Promise<Item | null> {
    const item = await this.itemRepository.findOne({ where: { id } })
    return item
  }

  // Update an Item
  public async update(id: number, item: Item): Promise<Item | null> {
    const updatedItem = await this.get(id)
    if (updatedItem) {
      this.itemRepository.merge(updatedItem, item)
      return this.itemRepository.save(updatedItem)
    }
    return null
  }

  // Delete an Item
  public async delete(id: number): Promise<void> {
    const item = await this.get(id)
    if (item) {
      await this.itemRepository.remove(item)
    }
  }

  // get all Items
  public async getAll(): Promise<Item[]> {
    return this.itemRepository.find()
  }

  // get all Items by category
  public async getAllByCategory(category: string): Promise<Item[]> {
    return this.itemRepository.find({ where: { category: { name: category } } })
  }
}

export default ItemService
