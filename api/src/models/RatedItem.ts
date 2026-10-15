import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, RelationId,
} from 'typeorm'
import { Min, Max } from 'class-validator'
import User from '@/models/User'
import Item, { ItemSummary } from '@/models/Item'
import { decimalToNumber } from '@/helpers/DecimalHelper'

/** A rating as the API returns it, with its item and the item's category. */
export interface RatedItemResponse extends Pick<RatedItem, 'id' | 'rating' | 'userId' | 'ratedAt' | 'notes'> {
  item: ItemSummary
}

/** Fields accepted when changing a rating. */
export interface RatingInput extends Pick<RatedItem, 'rating'>, Partial<Pick<RatedItem, 'notes'>> {}

/** Fields accepted when rating an item. */
export interface NewRatingInput extends RatingInput {
  /**
   * Id of the item being rated.
   * @isInt
   * @example 12
   */
  item_id: number
}

/** Fields accepted when changing a rating; fields left out keep their value. */
export interface RatingUpdate extends Partial<RatingInput> {}

@Entity()
export default class RatedItem {
  /**
   * @isInt
   * @example 40
   */
  @PrimaryGeneratedColumn()
    id!: number

  @ManyToOne(() => Item, (item) => item.ratings)
  @JoinColumn({ name: 'item_id' }) // This line names the column as 'item_id '
    item!: Item

  /**
   * Grade from 0 to 10.
   * @isDouble
   * @minimum 0
   * @maximum 10
   * @example 8.5
   */
  @Column({ type: 'decimal', precision: 4, scale: 2, transformer: decimalToNumber })
  @Min(0.0)
  @Max(10.0)
    rating!: number

  @ManyToOne(() => User, (user) => user.ratedItems)
  @JoinColumn({ name: 'user_id' }) // This line names the column as 'user_id'
    user!: User

  /**
   * Id of the user who gave the rating, so clients can group a user's ratings without loading the user.
   * @isInt
   * @example 5
   */
  @RelationId((ratedItem: RatedItem) => ratedItem.user)
    userId!: number

  /** When the rating was given; a user can rate the same item many times. */
  @CreateDateColumn({ name: 'rated_at' })
    ratedAt!: Date

  /** @example "Slow start, brilliant ending." */
  @Column('varchar', { nullable: true })
    notes!: string | null
}
