import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, RelationId,
} from 'typeorm'
import { Min, Max } from 'class-validator'
import User from '@/models/User'
import Item from '@/models/Item'
import { decimalToNumber } from '@/helpers/DecimalHelper'
import RankingScope from '@/models/RankingScope'

/** Lowest grade a rating can give. */
export const MIN_GRADE = 0

/** Highest grade a rating can give. */
export const MAX_GRADE = 10

/** An attribute value an item must hold: text attributes match when they contain the value, others when equal to it. */
export interface AttributeFilter {
  attributeId: number
  value: string
}

/**
 * Filters for listing ratings. Every rating of an item is kept when the item matches, so its grades stay complete.
 * The grade range applies to the signed-in user's personal grade for the MINE scope, which also keeps only the items
 * they rated, and to the collective grade for the ALL scope.
 */
export interface RatingFilters {
  name?: string
  categoryIds: number[]
  attributes: AttributeFilter[]
  minGrade?: number
  maxGrade?: number
  scope: RankingScope
}

@Entity()
export default class RatedItem {
  @PrimaryGeneratedColumn()
    id!: number

  @ManyToOne(() => Item, (item) => item.ratings)
  @JoinColumn({ name: 'item_id' }) // This line names the column as 'item_id '
    item!: Item

  @Column({ type: 'decimal', precision: 4, scale: 2, transformer: decimalToNumber })
  @Min(MIN_GRADE)
  @Max(MAX_GRADE)
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
    notes!: string
}
