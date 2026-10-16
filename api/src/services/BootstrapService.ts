import Attribute from '@/models/Attribute'
import { BOOTSTRAP_CATEGORIES, BootstrapAdmin } from '@/models/BootstrapData'
import User from '@/models/User'
import UserRole from '@/models/UserRole'
import AttributeService from '@/services/AttributeService'
import CategoryService from '@/services/CategoryService'
import UserService from '@/services/UserService'
import { logger } from '@/helpers/Logger'

/** Creates the first admin and the starter categories and attributes, skipping whatever already exists. */
export default class BootstrapService {
  private userService = new UserService()

  private categoryService = new CategoryService()

  private attributeService = new AttributeService()

  /** Seeds the admin account and the starter categories; safe to run on every start. */
  public async seed(admin: BootstrapAdmin): Promise<void> {
    await this.seedAdmin(admin)
    await this.seedCategories()
  }

  /** Creates the admin account unless a user with its username exists. */
  private async seedAdmin({ username, email, password }: BootstrapAdmin): Promise<void> {
    if (await this.userService.getByUsername(username)) {
      return
    }
    await this.userService.create({ username, email, password, roles: [UserRole.ADMIN, UserRole.USER], ratedItems: [] } as Omit<User, 'id'>)
    logger.info(`Created bootstrap admin user ${username}`)
  }

  /** Creates each starter category that does not exist yet, reusing attributes with the same name and value type. */
  private async seedCategories(): Promise<void> {
    for (const { attributes, ...category } of BOOTSTRAP_CATEGORIES) {
      if (await this.categoryService.get(category.name)) {
        continue
      }
      const attributeIds: number[] = []
      for (const attribute of attributes) {
        const existing = await this.attributeService.getAttributeByName(attribute.name, attribute.valueType)
        attributeIds.push((existing ?? await this.attributeService.createAttribute(attribute as Attribute)).id)
      }
      await this.categoryService.create({ ...category, attributeIds })
      logger.info(`Created bootstrap category ${category.name}`)
    }
  }
}
