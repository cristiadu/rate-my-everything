import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import User from '@/models/User'
import BaseService from '@/services/BaseService'

// create user service based on RatedItemService.ts in this directory
export default class UserService extends BaseService<User> {
  constructor() {
    super(User)
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    // Hash the password before saving
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(user.password, saltRounds)
    const newUser = this.repository.create({ ...user, password: hashedPassword })
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

  // login method
  async login(username: string, password: string): Promise<string | null> {
    const user = await this.repository.findOne({ where: { username } })
    if (user && await bcrypt.compare(password, user.password)) {
      // Payload that will be included in the token
      const payload = { username: user.username, id: user.id, roles: user.roles }

      // Secret key used to sign the token
      const secretKey = process.env.JWT_SECRET
      if (!secretKey) {
        throw new Error('JWT_SECRET environment variable is not defined')
      }

      // Options for the token
      const options = { expiresIn: 3 * 24 * 60 * 60 } // 3 days in seconds

      // Generate the token
      const token = jwt.sign(payload, secretKey, options)

      return token
    }

    return null
  }
}
