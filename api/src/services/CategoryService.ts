import { DBConnection } from '..'
import Category from '../models/Category'

// Method for CRUD of a Category, which is a model for a category.
class CategoryService {
    private categoryRepository

    constructor() {
        this.categoryRepository = DBConnection.getRepository(Category)
    }

    // Create a new Category
    public async create(category: Category): Promise<Category> {
        const newCategory = this.categoryRepository.create(category)
        return this.categoryRepository.save(newCategory)
    }

    // Read a Category by name
    public async get(name: string): Promise<Category | null> {
        const category = await this.categoryRepository.findOne({ where: { name } })
        return category
    }

    // Update a Category
    public async update(name: string, category: Category): Promise<Category | null> {
        const updatedCategory = await this.get(name)
        if (updatedCategory) {
            this.categoryRepository.merge(updatedCategory, category)
            return this.categoryRepository.save(updatedCategory)
        }
        return null
    }

    // Delete a Category
    public async delete(name: string): Promise<void> {
        const category = await this.get(name)
        if (category) {
            await this.categoryRepository.remove(category)
        }
    }

    // get all Categories
    public async getAll(): Promise<Category[]> {
        return this.categoryRepository.find()
    }
}

export default CategoryService
