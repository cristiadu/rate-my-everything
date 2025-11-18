import { ResourceAlreadyExists } from '@/errors/ResourceAlreadyExists'
import Category from '@/models/Category'
import BaseService from '@/services/BaseService'
import { Not } from 'typeorm'

class CategoryService extends BaseService<Category> {
  constructor() {
    super(Category)
  }

  // Create a new Category
  public async create(category: Category): Promise<Category> {
    const newCategory = this.repository.create(category)
    return this.repository.save(newCategory)
  }

  // Read a Category by name
  public async get(nameToSearch: string): Promise<Category | null> {
    return await this.repository.findOne({ where: { name: nameToSearch } })
  }

  // Update a Category
  public async update(name: string, category: Omit<Category, 'id'>): Promise<Category | null> {
    const existingCategory = await this.get(name)
    if (!existingCategory || !existingCategory.id) {
      return null
    }

    if (category.name && category.name !== existingCategory.name) {
      const duplicate = await this.repository.findOne({ where: { name: category.name, id: Not(existingCategory.id) } })
      if (duplicate) {
        throw new ResourceAlreadyExists('Category', category.name)
      }
    }

    this.repository.merge(existingCategory, category)
    return this.repository.save(existingCategory)
  }

  // Delete a Category
  public async delete(name: string): Promise<void> {
    const category = await this.get(name)
    if (category) {
      console.log(`Deleting category: ${category.name}`)
      await this.repository.delete(category.id)
    }
  }

  // get all Categories
  public async getAll(): Promise<Category[]> {
    return this.repository.find()
  }
}

export default CategoryService
