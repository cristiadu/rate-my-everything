import { ResourceAlreadyExists } from '@/errors/ResourceAlreadyExists'
import Category, { CategoryInput } from '@/models/Category'
import AttributeService from '@/services/AttributeService'
import BaseService from '@/services/BaseService'
import { Not } from 'typeorm'
import { findSimilarByName } from '@/helpers/SimilarityHelper'

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

  /** Reads a category by id with its attributes. */
  public async getById(id: number): Promise<Category | null> {
    return this.repository.findOne({ where: { id }, relations: { attributes: true } })
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

  /** Get the Categories whose name is likely a duplicate of the given name, most similar first. */
  public async getSimilar(name: string): Promise<Category[]> {
    return findSimilarByName(await this.getAll(), name)
  }
}

export default CategoryService
