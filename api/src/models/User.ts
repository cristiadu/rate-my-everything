import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
} from 'typeorm'
import RatedItem from '@/models/RatedItem'
import UserRole from '@/models/UserRole'

export class UserTokenResponse {
    token!: string
    user!: SessionUser
}

export class SessionUser implements Omit<User, 'password' | 'ratedItems' | 'email'> {
    id!: number
    username!: string
    roles!: UserRole[]
}

/** A user reduced to their id and username, as comments and change requests return them. */
export type UserSummary = Pick<User, 'id' | 'username'>

/** A user as the API returns it, without the password hash. */
export type UserResponse = Omit<User, 'password' | 'ratedItems'>

/** Fields accepted when creating or updating a user; without a password, an update keeps the current one. */
export type UserInput = Pick<User, 'username' | 'email' | 'roles'> & Partial<Pick<User, 'password'>>

/** Fields accepted when signing up. */
export type RegisterInput = Pick<User, 'username' | 'email' | 'password'> & Partial<Pick<User, 'roles'>>

/** Credentials sent to sign in. */
export type LoginInput = Pick<User, 'username' | 'password'>

@Entity()
export default class User {
    @PrimaryGeneratedColumn()
      id!: number

    @Column('varchar')
      username!: string

    @Column('varchar')
      email!: string

    @Column('varchar')
      password!: string

    @Column('text', { array: true })
      roles!: UserRole[]

    @OneToMany(() => RatedItem, (ratedItem) => ratedItem.user)
      ratedItems!: RatedItem[]
}
