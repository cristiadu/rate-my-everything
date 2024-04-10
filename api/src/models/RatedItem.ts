import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export default class RatedItem {
    @PrimaryGeneratedColumn()
      id!: number

    @Column()
      item_id!: number

    @Column()
      rating!: number

    @Column()
      user_id!: number

    @Column({ nullable: true })
      notes!: string
}
