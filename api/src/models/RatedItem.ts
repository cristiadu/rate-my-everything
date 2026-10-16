import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, RelationId,
} from 'typeorm'
import { Min, Max } from 'class-validator'
import User from '@/models/User'
import Item, { ItemSummary } from '@/models/Item'
import { decimalToNumber } from '@/helpers/DecimalHelper'
import RankingScope from '@/models/RankingScope'
import type { ResourceId } from '@/models/ResourceId'

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

/** Query parameters that narrow down the ratings list. */
export interface RatingQuery {
  /**
   * Part of the item's name, in any case.
   * @example "dune"
   */
  name?: string
  /** Categories the item must be in; repeat the parameter for several. */
  categoryId?: ResourceId[]
  /**
   * Attribute values the item must hold, each as `<attributeId>:<value>`; repeat the parameter for several.
   * Text attributes match when they contain the value, other types when they equal it.
   * @example ["3:Frank Herbert"]
   */
  attribute?: string[]
  /**
   * Lowest grade: the signed-in user's own grade for the `mine` scope, the collective grade for `all`.
   * @minimum 0
   * @maximum 10
   * @example 6.5
   */
  minGrade?: number
  /**
   * Highest grade: the signed-in user's own grade for the `mine` scope, the collective grade for `all`.
   * @minimum 0
   * @maximum 10
   * @example 9
   */
  maxGrade?: number
  /** Whose grade the range applies to. `mine` also keeps only the items the signed-in user rated. Defaults to `all`. */
  scope?: RankingScope
}

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
  @Min(MIN_GRADE)
  @Max(MAX_GRADE)
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
