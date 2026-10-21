import crypto from 'crypto'
import { MoreThan } from 'typeorm'
import PasswordReset from '@/models/PasswordReset'
import BaseService from '@/services/BaseService'
import UserService from '@/services/UserService'
import { mailService } from '@/services/MailService'
import { InvalidResetToken } from '@/errors/InvalidResetToken'
import { logger } from '@/helpers/Logger'

/** How long a reset link works, in minutes. */
const RESET_TOKEN_VALID_MINUTES = 60

/** Random bytes in each reset token (256 bits). */
const RESET_TOKEN_BYTES = 32

/** Milliseconds in a minute. */
const MS_PER_MINUTE = 60 * 1000

/** Hashes a reset token the way it is stored. */
const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex')

/** Creates single-use, expiring password reset tokens, emails them, and changes the password once one comes back. */
export default class PasswordResetService extends BaseService<PasswordReset> {
  private userService = new UserService()

  constructor() {
    super(PasswordReset)
  }

  /**
   * Emails a reset link to every account using the address, replacing any link sent before. Does nothing for an unknown
   * address, and sends the emails in the background, so neither the answer nor its timing tells whether the address exists.
   */
  async requestReset(email: string): Promise<void> {
    const users = await this.userService.getAllByEmail(email)
    for (const user of users) {
      const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString('base64url')
      await this.repository.delete({ user: { id: user.id } })
      await this.repository.save(this.repository.create({
        user,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_VALID_MINUTES * MS_PER_MINUTE),
      }))
      mailService.sendPasswordReset(user.email, user.username, token, RESET_TOKEN_VALID_MINUTES)
        .catch((error) => logger.error(error, `Could not send the password reset email to user ${user.id}`))
    }
  }

  /** Sets a new password for the token's user and removes the token; throws InvalidResetToken when it is unknown or expired. */
  async resetPassword(token: string, password: string): Promise<void> {
    const reset = await this.repository.findOne({
      where: { tokenHash: hashToken(token), expiresAt: MoreThan(new Date()) },
      relations: { user: true },
    })
    if (!reset) {
      throw new InvalidResetToken()
    }

    await this.userService.update(reset.user.id, { password })
    await this.repository.delete({ user: { id: reset.user.id } })
  }
}
