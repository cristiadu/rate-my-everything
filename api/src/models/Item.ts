import {
  Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm'
import RatedItem from '@/models/RatedItem'
import Category, { CategorySummary } from '@/models/Category'
import AttributeValue, { ItemAttributeValue } from '@/models/AttributeValue'

/** One value an item holds for an attribute of its category. */
export interface AttributeValueInput {
  /**
   * @isInt
   * @example 3
   */
  attributeId: number
  /** @example "1965" */
  value: string
}

/** Fields accepted when creating or updating an item; attribute values replace the item's current ones. */
export interface ItemInput extends Partial<Pick<Item, 'name' | 'description' | 'imageUrl'>> {
  /**
   * @isInt
   * @example 2
   */
  categoryId?: number
  attributeValues?: AttributeValueInput[]
}

/** An item as the API returns it with its category. */
export interface ItemSummary extends Pick<Item, 'id' | 'name' | 'description' | 'imageUrl'> {
  category: CategorySummary
}

/** An item as the API returns it, with its category and the values of that category's attributes. */
export interface ItemResponse extends ItemSummary {
  attributes: ItemAttributeValue[]
}

/** An item given by its id. */
export interface ItemReference extends Pick<Item, 'id'> {}

@Entity()
export default class Item {
    /**
     * @isInt
     * @example 12
     */
    @PrimaryGeneratedColumn()
      id!: number

    /** @example "Dune" */
    @Column('varchar')
      name!: string

    /** @example "Frank Herbert's novel about the desert planet Arrakis." */
    @Column('varchar')
      description!: string

    /**
     * Picture shown next to the item in rankings.
     * @example "https://example.com/images/dune.jpg"
     */
    @Column('varchar', { nullable: true })
      imageUrl?: string | null

    @ManyToOne(() => Category, (category) => category.items)
    @JoinColumn({ name: 'category' })
      category!: Category

    @OneToMany(() => RatedItem, (ratedItem) => ratedItem.item)
      ratings!: RatedItem[]

    @OneToMany(() => AttributeValue, (attributeValue) => attributeValue.item, { cascade: true })
      attributes!: AttributeValue[]
}
