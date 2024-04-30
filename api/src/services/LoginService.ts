import jwt from 'jsonwebtoken'
import User from '../models/User'
import BaseService from './BaseService'

// create user service based on RatedItemService.ts in this directory
export default class LoginService extends BaseService {
  constructor() {
    super(User)
  }

  // login method
  async login(username: string, password: string): Promise<string | null> {
    const user = await this.repository.findOne({ where: { username } })
    if (user && user.password === password) {
      // Payload that will be included in the token
      const payload = { username: user.username, id: user.id, roles: user.roles }

      // Secret key used to sign the token
      const secretKey = 'your-secret-key'

      // Options for the token
      const options = { expiresIn: '3d' }

      // Generate the token
      const token = jwt.sign(payload, secretKey, options)

      return token
    }

    return null
  }
}
