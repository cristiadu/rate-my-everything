import {
  Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm'
import User from '@/models/User'

/** Email address to send a password reset link to. */
export interface PasswordResetRequest extends Pick<User, 'email'> {}

/** A new password and the reset token from the emailed link that allows setting it. */
export interface PasswordResetInput extends Pick<User, 'password'> {
  /**
   * Token from the reset link's `token` query parameter.
   * @example "q8GmK1dWQ0nR3yVb7cX2tZ5hJ9pL4sA6eF0uN1oI8wE"
   */
  token: string
}

/** A pending password reset: the hash of the token emailed to the user and when it stops working; removed once used. */
@Entity()
export default class PasswordReset {
  @PrimaryGeneratedColumn()
    id!: number

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
    user!: User

  /** SHA-256 of the emailed token, so a database leak does not hand out working links. */
  @Column('varchar', { unique: true })
    tokenHash!: string

  @Column('timestamptz')
    expiresAt!: Date
}
