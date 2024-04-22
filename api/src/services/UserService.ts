import { DBConnection } from '..'
import User from '../models/User'

// create user service based on RatedItemService.ts in this directory
export class UserService {
    private userRepository

    constructor() {
        this.userRepository = DBConnection.getRepository(User)
    }

    async create(user: User): Promise<User> {
        const newUser = this.userRepository.create(user)
        return this.userRepository.save(newUser)
    }

    async getById(id: number): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { id } })
        return user || null
    }

    async update(id: number, user: User): Promise<User | null> {
        const existingUser = await this.getById(id)
        if (existingUser) {
            this.userRepository.merge(user, existingUser)
            return this.userRepository.save(user)
        }
        return null
    }

    async delete(id: number): Promise<void> {
        const user = await this.getById(id)
        if (user) {
            await this.userRepository.remove(user)
        }
    }

    async getAll(): Promise<User[]> {
        return await this.userRepository.find()
    }

    async getByUsername(username: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { username } })
        return user || null
    }
}
