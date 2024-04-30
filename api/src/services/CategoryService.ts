import Category from '../models/Category'
import BaseService from './BaseService'

// Method for CRUD of a Category, which is a model for a category.
class CategoryService extends BaseService {
  constructor() {
    super(Category)
  }

  // Create a new Category
  public async create(category: Category): Promise<Category> {
    const newCategory = this.repository.create(category)
    return this.repository.save(newCategory)
  }

  // Read a Category by name
  public async get(name: string): Promise<Category | null> {
    const category = await this.repository.findOne({ where: { name } })
    return category
  }

  // Update a Category
  public async update(name: string, category: Category): Promise<Category | null> {
    const updatedCategory = await this.get(name)
    if (updatedCategory) {
      this.repository.merge(updatedCategory, category)
      return this.repository.save(updatedCategory)
    }
    return null
  }

  // Delete a Category
  public async delete(name: string): Promise<void> {
    const category = await this.get(name)
    if (category) {
      await this.repository.remove(category)
    }
  }

  // get all Categories
  public async getAll(): Promise<Category[]> {
    return this.repository.find()
  }
}

export default CategoryService
