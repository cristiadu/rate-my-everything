import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, RelationId,
} from 'typeorm'
import { Min, Max } from 'class-validator'
import User from '@/models/User'
import Item, { ItemSummary } from '@/models/Item'
import { decimalToNumber } from '@/helpers/DecimalHelper'

/** A rating as the API returns it, with its item and the item's category. */
export type RatedItemResponse = Omit<RatedItem, 'item' | 'user'> & { item: ItemSummary }

/** Fields accepted when changing a rating. */
export type RatingInput = Pick<RatedItem, 'rating'> & Partial<Pick<RatedItem, 'notes'>>

/** Fields accepted when rating an item. */
export type NewRatingInput = RatingInput & { item_id: number }

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

  /** Id of the user who gave the rating, so clients can group a user's ratings without loading the user. */
  @RelationId((ratedItem: RatedItem) => ratedItem.user)
    userId!: number

  /** When the rating was given; a user can rate the same item many times. */
  @CreateDateColumn({ name: 'rated_at' })
    ratedAt!: Date

  @Column('varchar', { nullable: true })
    notes!: string | null
}
