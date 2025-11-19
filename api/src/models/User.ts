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
