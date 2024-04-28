import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
} from 'typeorm'
import RatedItem from './RatedItem'
import UserRole from './UserRole'

@Entity()
export default class User {
    @PrimaryGeneratedColumn()
      id!: number

    @Column()
      username!: string

    @Column()
      email!: string

    @Column()
      password!: string

    @Column()
      roles!: UserRole[]

    @OneToMany(() => RatedItem, (ratedItem) => ratedItem.user)
      ratedItems!: RatedItem[]
}
