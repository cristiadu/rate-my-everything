import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ValueTransformer,
} from 'typeorm'
import { Min, Max } from 'class-validator'
import User from '@/models/User'
import Item from '@/models/Item'

/** Postgres returns decimal columns as strings; read ratings back as numbers. */
const decimalToNumber: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? null : parseFloat(value)),
}

@Entity()
export default class RatedItem {
  @PrimaryGeneratedColumn()
    id!: number

  @ManyToOne(() => Item, (item) => item.ratings)
  @JoinColumn({ name: 'item_id' }) // This line names the column as 'item_id '
    item!: Item

  @Column({ type: 'decimal', precision: 4, scale: 2, transformer: decimalToNumber })
  @Min(0.0)
  @Max(10.0)
    rating!: number

  @ManyToOne(() => User, (user) => user.ratedItems)
  @JoinColumn({ name: 'user_id' }) // This line names the column as 'user_id'
    user!: User

  @Column('varchar', { nullable: true })
    notes!: string
}
