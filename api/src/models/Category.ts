import {
  Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm'
import Attribute, { AttributeResponse } from '@/models/Attribute'
import Item from '@/models/Item'

/** Fields accepted when creating or updating a category, with linked attributes given by id. */
export type CategoryInput = Partial<Pick<Category, 'name' | 'description'>> & { attributeIds?: number[] }

/** A category without the attributes and items linked to it. */
export type CategorySummary = Omit<Category, 'attributes' | 'items'>

/** A category as the API returns it, with its attributes. */
export type CategoryResponse = CategorySummary & { attributes: AttributeResponse[] }

@Entity()
export default class Category {
    @PrimaryGeneratedColumn()
      id!: number
  
    @Column('varchar', { unique: true })
      name!: string
    
    @Column('varchar', { nullable: true })
      description?: string | null

    @ManyToMany(() => Attribute, (attribute) => attribute.categories)
    @JoinTable({ name: 'category_attributes' })
      attributes!: Attribute[]

    @OneToMany(() => Item, (item) => item.category)
      items!: Item[]
}
