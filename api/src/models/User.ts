import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
} from 'typeorm'
import RatedItem from '@/models/RatedItem'
import UserRole from '@/models/UserRole'

/** A signed-in session: the JWT to send as a bearer token and the user it belongs to. */
export class UserTokenResponse {
    /** @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidXNlcm5hbWUiOiJhZGEifQ.signature" */
    token!: string
    user!: SessionUser
}

/** The signed-in user as the session token carries it. */
export class SessionUser implements Pick<User, 'id' | 'username' | 'roles'> {
    /**
     * @isInt
     * @example 5
     */
    id!: number
    /** @example "ada" */
    username!: string
    roles!: UserRole[]
}

/** A user reduced to their id and username, as comments and change requests return them. */
export interface UserSummary extends Pick<User, 'id' | 'username'> {}

/** A user as the API returns it, without the password hash. */
export interface UserResponse extends Pick<User, 'id' | 'username' | 'email' | 'roles'> {}

/** Fields accepted when creating or updating a user; without a password, an update keeps the current one. */
export interface UserInput extends Pick<User, 'username' | 'email' | 'roles'>, Partial<Pick<User, 'password'>> {}

/** Fields accepted when changing a user; fields left out keep their value. */
export interface UserUpdate extends Partial<UserInput> {}

/** Fields accepted when signing up; every new account gets the user role, and only admins grant others. */
export interface RegisterInput extends Pick<User, 'username' | 'email' | 'password'> {}

/** Credentials sent to sign in. */
export interface LoginInput extends Pick<User, 'username' | 'password'> {}

@Entity()
export default class User {
    /**
     * @isInt
     * @example 5
     */
    @PrimaryGeneratedColumn()
      id!: number

    /** @example "ada" */
    @Column('varchar')
      username!: string

    /** @example "ada@example.com" */
    @Column('varchar')
      email!: string

    /**
     * Plain-text password when sent to the API; stored only as a hash and never returned.
     * @example "correct-horse-battery-staple"
     */
    @Column('varchar')
      password!: string

    @Column('text', { array: true })
      roles!: UserRole[]

    @OneToMany(() => RatedItem, (ratedItem) => ratedItem.user)
      ratedItems!: RatedItem[]
}
