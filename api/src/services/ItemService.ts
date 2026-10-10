import { DBConnection } from '@/index'
import Item, { AttributeValueInput, ItemInput } from '@/models/Item'
import Category from '@/models/Category'
import AttributeValue from '@/models/AttributeValue'
import BaseService from '@/services/BaseService'
import { InvalidItemAttributes } from '@/errors/InvalidItemAttributes'

/** Relations returned with every item so clients see its category and attribute values. */
const ITEM_RELATIONS = { category: true, attributes: { attribute: true } }

class ItemService extends BaseService<Item> {
  constructor() {
    super(Item)
  }

  // Load a category with its attributes, failing when it does not exist
  private async getCategory(categoryId: number | undefined): Promise<Category> {
    const category = categoryId === undefined
      ? null
      : await DBConnection.getRepository(Category).findOne({ where: { id: categoryId }, relations: { attributes: true } })
    if (!category) {
      throw new InvalidItemAttributes(`Category ${categoryId} does not exist`)
    }
    return category
  }

  // Build the item's attribute values, keeping the ids of values that already exist for the same attribute
  private buildAttributeValues(category: Category, inputs: AttributeValueInput[], currentValues: AttributeValue[]): AttributeValue[] {
    const categoryAttributes = new Map(category.attributes.map((attribute) => [attribute.id, attribute]))
    const unknownIds = inputs.map((input) => input.attributeId).filter((attributeId) => !categoryAttributes.has(attributeId))
    if (unknownIds.length > 0) {
      throw new InvalidItemAttributes(`Attributes ${unknownIds.join(', ')} do not belong to category "${category.name}"`)
    }

    return inputs.map((input) => {
      const currentValue = currentValues.find((value) => value.attribute.id === input.attributeId)
      return { id: currentValue?.id, attribute: categoryAttributes.get(input.attributeId), value: input.value } as AttributeValue
    })
  }

  // Create a new Item with its attribute values
  public async create(input: ItemInput): Promise<Item> {
    const { name, description, imageUrl, categoryId, attributeValues = [] } = input
    const category = await this.getCategory(categoryId)
    const newItem = this.repository.create({ name, description, imageUrl, category })
    newItem.attributes = this.buildAttributeValues(category, attributeValues, [])
    const savedItem = await this.repository.save(newItem)
    return this.repository.findOneOrFail({ where: { id: savedItem.id }, relations: ITEM_RELATIONS })
  }

  // Read an Item by id
  public async get(id: number): Promise<Item | null> {
    return this.repository.findOne({ where: { id }, relations: ITEM_RELATIONS })
  }

  // Update the fields that were sent; attribute values are only replaced when a category or values are sent
  public async update(id: number, input: ItemInput): Promise<Item | null> {
    const existingItem = await this.get(id)
    if (!existingItem) {
      return null
    }

    const { name, description, imageUrl, categoryId, attributeValues } = input
    this.repository.merge(existingItem, { name, description, imageUrl })

    if (categoryId !== undefined || attributeValues) {
      const category = await this.getCategory(categoryId ?? existingItem.category?.id)
      const currentInputs = existingItem.attributes.map((value) => ({ attributeId: value.attribute.id, value: value.value }))
      existingItem.category = category
      existingItem.attributes = this.buildAttributeValues(category, attributeValues ?? currentInputs, existingItem.attributes)
    }

    await this.repository.save(existingItem)
    return this.get(id)
  }

  // Delete an Item
  public async delete(id: number): Promise<void> {
    const item = await this.get(id)
    if (item) {
      await this.repository.delete(item.id)
    }
  }

  // get all Items
  public async getAll(): Promise<Item[]> {
    return this.repository.find({ relations: ITEM_RELATIONS })
  }

  // get all Items by category
  public async getAllByCategory(category: string): Promise<Item[]> {
    return this.repository.find({ where: { category: { name: category } }, relations: ITEM_RELATIONS })
  }
}

export default ItemService
