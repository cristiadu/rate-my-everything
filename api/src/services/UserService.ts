import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import User, { SessionUser, UserTokenResponse } from '@/models/User'
import BaseService from '@/services/BaseService'
import { InvalidCredentials } from '@/errors/InvalidCredentials'

const TOKEN_EXPIRY = 3 * 24 * 60 * 60 // 3 days in seconds
const SALT_ROUNDS = 10

export default class UserService extends BaseService<User> {
  constructor() {
    super(User)
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS)
    const newUser = this.repository.create({ ...user, password: hashedPassword })
    return this.repository.save(newUser)
  }

  async getById(id: number): Promise<User | null> {
    const user = await this.repository.findOne({ where: { id } })
    return user || null
  }

  async update(id: number, user: Partial<Omit<User, 'id'>>): Promise<User | null> {
    const existingUser = await this.getById(id)
    if (existingUser) {
      // Keep the current password unless a new one is sent, and never store it in plain text
      const { password, ...changes } = user
      this.repository.merge(existingUser, changes)
      if (password) {
        existingUser.password = await bcrypt.hash(password, SALT_ROUNDS)
      }
      return this.repository.save(existingUser)
    }
    return null
  }

  async delete(id: number): Promise<void> {
    const user = await this.getById(id)
    if (user) {
      await this.repository.delete(user.id)
    }
  }

  async getAll(): Promise<User[]> {
    return this.repository.find()
  }

  async getByUsername(username: string): Promise<User | null> {
    const user = await this.repository.findOne({ where: { username } })
    return user || null
  }

  async login(username: string, password: string): Promise<UserTokenResponse> {
    const user = await this.repository.findOne({ where: { username } })
    
    if (user && await bcrypt.compare(password, user.password)) {
      const payload: SessionUser = { 
        username: user.username, 
        id: user.id, 
        roles: user.roles 
      }

      const secretKey = process.env.JWT_SECRET
      if (!secretKey) {
        throw new Error('JWT_SECRET environment variable is not defined')
      }

      const options = { expiresIn: TOKEN_EXPIRY }

      const token = jwt.sign(payload, secretKey, options)

      const response: UserTokenResponse = {
        token, 
        user: {
          id: user.id,
          username: user.username,
          roles: user.roles
        }
      }

      return response
    }

    throw new InvalidCredentials("Invalid credentials provided.")
  }
}
