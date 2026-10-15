import {
  Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm'
import RatedItem from '@/models/RatedItem'
import Category, { CategorySummary } from '@/models/Category'
import AttributeValue, { ItemAttributeValue } from '@/models/AttributeValue'

/** One value an item holds for an attribute of its category. */
export interface AttributeValueInput {
  attributeId: number
  value: string
}

/** Fields accepted when creating or updating an item; attribute values replace the item's current ones. */
export type ItemInput = Partial<Pick<Item, 'name' | 'description' | 'imageUrl'>> & {
  categoryId?: number
  attributeValues?: AttributeValueInput[]
}

/** An item as the API returns it with its category, which is null when the item has none. */
export type ItemSummary = Omit<Item, 'category' | 'ratings' | 'attributes'> & { category: CategorySummary | null }

/** An item as the API returns it, with its category and the values of that category's attributes. */
export type ItemResponse = ItemSummary & { attributes: ItemAttributeValue[] }

@Entity()
export default class Item {
    @PrimaryGeneratedColumn()
      id!: number

    @Column('varchar')
      name!: string

    @Column('varchar')
      description!: string

    /** Picture shown next to the item in rankings. */
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
