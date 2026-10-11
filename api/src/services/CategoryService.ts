import { ResourceAlreadyExists } from '@/errors/ResourceAlreadyExists'
import Category, { CategoryInput } from '@/models/Category'
import AttributeService from '@/services/AttributeService'
import BaseService from '@/services/BaseService'
import { Not } from 'typeorm'

class CategoryService extends BaseService<Category> {
  private attributeService = new AttributeService()

  constructor() {
    super(Category)
  }

  // Create a new Category
  public async create({ attributeIds, ...category }: CategoryInput): Promise<Category> {
    const newCategory = this.repository.create(category)
    if (attributeIds) {
      newCategory.attributes = await this.attributeService.fetchAttributesByID(attributeIds)
    }
    return this.repository.save(newCategory)
  }

  // Read a Category by name
  public async get(nameToSearch: string): Promise<Category | null> {
    return await this.repository.findOne({ where: { name: nameToSearch }, relations: { attributes: true } })
  }

  // Update a Category
  public async update(name: string, { attributeIds, ...category }: CategoryInput): Promise<Category | null> {
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
    if (attributeIds) {
      existingCategory.attributes = await this.attributeService.fetchAttributesByID(attributeIds)
    }
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
    return this.repository.find({ relations: { attributes: true }, order: { id: 'ASC' } })
  }
}

export default CategoryService
