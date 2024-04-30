import User from '../models/User'
import BaseService from './BaseService'

// create user service based on RatedItemService.ts in this directory
export default class UserService extends BaseService {
  constructor() {
    super(User)
  }

  async create(user: User): Promise<User> {
    const newUser = this.repository.create(user)
    return this.repository.save(newUser)
  }

  async getById(id: number): Promise<User | null> {
    const user = await this.repository.findOne({ where: { id } })
    return user || null
  }

  async update(id: number, user: User): Promise<User | null> {
    const existingUser = await this.getById(id)
    if (existingUser) {
      this.repository.merge(user, existingUser)
      return this.repository.save(user)
    }
    return null
  }

  async delete(id: number): Promise<void> {
    const user = await this.getById(id)
    if (user) {
      await this.repository.remove(user)
    }
  }

  async getAll(): Promise<User[]> {
    return this.repository.find()
  }

  async getByUsername(username: string): Promise<User | null> {
    const user = await this.repository.findOne({ where: { username } })
    return user || null
  }
}
