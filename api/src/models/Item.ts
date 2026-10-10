import {
  Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm'
import RatedItem from '@/models/RatedItem'
import Category from '@/models/Category'
import AttributeValue from '@/models/AttributeValue'

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
      imageUrl?: string

    @ManyToOne(() => Category, (category) => category.items)
    @JoinColumn({ name: 'category' })
      category!: Category

    @OneToMany(() => RatedItem, (ratedItem) => ratedItem.item)
      ratings!: RatedItem[]

    @OneToMany(() => AttributeValue, (attributeValue) => attributeValue.item, { cascade: true })
      attributes!: AttributeValue[]
}
