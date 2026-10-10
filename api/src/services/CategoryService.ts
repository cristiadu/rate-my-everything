import { ResourceAlreadyExists } from '@/errors/ResourceAlreadyExists'
import { UnknownAttributes } from '@/errors/UnknownAttributes'
import Attribute from '@/models/Attribute'
import Category, { CategoryInput } from '@/models/Category'
import BaseService from '@/services/BaseService'
import { DBConnection } from '@/index'
import { In, Not } from 'typeorm'

class CategoryService extends BaseService<Category> {
  constructor() {
    super(Category)
  }

  /** Loads the attributes with the given ids; throws UnknownAttributes when any id does not exist. */
  private async resolveAttributes(attributeIds: number[]): Promise<Attribute[]> {
    const uniqueIds = [...new Set(attributeIds)]
    if (uniqueIds.length === 0) {
      return []
    }

    const attributes = await DBConnection.getRepository(Attribute).findBy({ id: In(uniqueIds) })
    if (attributes.length !== uniqueIds.length) {
      const foundIds = new Set(attributes.map((attribute) => attribute.id))
      throw new UnknownAttributes(uniqueIds.filter((id) => !foundIds.has(id)))
    }
    return attributes
  }

  // Create a new Category
  public async create({ attributeIds, ...category }: CategoryInput): Promise<Category> {
    const newCategory = this.repository.create(category)
    if (attributeIds) {
      newCategory.attributes = await this.resolveAttributes(attributeIds)
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
      existingCategory.attributes = await this.resolveAttributes(attributeIds)
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
