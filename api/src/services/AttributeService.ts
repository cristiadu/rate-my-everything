import { DBConnection } from '..'
import Attribute from '../models/Attribute'
import AttributeValue from '../models/AttributeValue'

// Method for CRUD of an Attribute and AttributeValue
class AttributeService {
    private attributeRepository

    private attributeValueRepository

    constructor() {
        this.attributeRepository = DBConnection.getRepository(Attribute)
        this.attributeValueRepository = DBConnection.getRepository(AttributeValue)
    }

    // Create a new Attribute
    public async createAttribute(attribute: Attribute): Promise<Attribute> {
        const newAttribute = this.attributeRepository.create(attribute)
        return this.attributeRepository.save(newAttribute)
    }

    // Create a new AttributeValue
    public async createAttributeValue(attributeValue: AttributeValue): Promise<AttributeValue> {
        const newAttributeValue = this.attributeValueRepository.create(attributeValue)
        return this.attributeValueRepository.save(newAttributeValue)
    }

    // Read an Attribute by id
    public async getAttribute(id: number): Promise<Attribute | null> {
        const attribute = await this.attributeRepository.findOne({ where: { id } })
        return attribute
    }

    // Read an AttributeValue by id
    public async getAttributeValue(id: number): Promise<AttributeValue | null> {
        const attributeValue = await this.attributeValueRepository.findOne({ where: { id } })
        return attributeValue
    }

    // Update an Attribute
    public async updateAttribute(id: number, attribute: Attribute): Promise<Attribute | null> {
        const updatedAttribute = await this.getAttribute(id)
        if (updatedAttribute) {
            this.attributeRepository.merge(updatedAttribute, attribute)
            return this.attributeRepository.save(updatedAttribute)
        }
        return null
    }

    // Update an AttributeValue
    public async updateAttributeValue(id: number, attributeValue: AttributeValue): Promise<AttributeValue | null> {
        const updatedAttributeValue = await this.getAttributeValue(id)
        if (updatedAttributeValue) {
            this.attributeValueRepository.merge(updatedAttributeValue, attributeValue)
            return this.attributeValueRepository.save(updatedAttributeValue)
        }
        return null
    }

    // Delete an Attribute
    public async deleteAttribute(id: number): Promise<void> {
        const attribute = await this.getAttribute(id)
        if (attribute) {
            await this.attributeRepository.remove(attribute)
        }
    }

    // Delete an AttributeValue
    public async deleteAttributeValue(id: number): Promise<void> {
        const attributeValue = await this.getAttributeValue(id)
        if (attributeValue) {
            await this.attributeValueRepository.remove(attributeValue)
        }
    }

    // get all Attributes
    public async getAllAttributes(): Promise<Attribute[]> {
        return this.attributeRepository.find()
    }

    // get all attributes values by attribute
    public async getAllAttributeValuesByAttribute(id: number): Promise<AttributeValue[]> {
        return this.attributeValueRepository.find({ where: { attribute: { id } } })
    }

    // get all AttributeValues
    public async getAllAttributeValues(): Promise<AttributeValue[]> {
        return this.attributeValueRepository.find()
    }
}

export default AttributeService
