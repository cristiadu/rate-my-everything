import {
  Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm'
import Attribute, { AttributeResponse } from '@/models/Attribute'
import Item from '@/models/Item'
import type { ResourceId } from '@/models/ResourceId'

/** Fields accepted when creating or updating a category, with linked attributes given by id. */
export interface CategoryInput extends Partial<Pick<Category, 'name' | 'description'>> {
  /**
   * Ids of the attributes that describe the category's items.
   * @example [3, 4]
   */
  attributeIds?: ResourceId[]
}

/** A category without the attributes and items linked to it. */
export interface CategorySummary extends Pick<Category, 'id' | 'name' | 'description'> {}

/** A category as the API returns it, with its attributes. */
export interface CategoryResponse extends CategorySummary {
  attributes: AttributeResponse[]
}

@Entity()
export default class Category {
    /**
     * @isInt
     * @example 2
     */
    @PrimaryGeneratedColumn()
      id!: number

    /** @example "Books" */
    @Column('varchar', { unique: true })
      name!: string

    /** @example "Novels, comics and non-fiction." */
    @Column('varchar', { nullable: true })
      description?: string | null

    @ManyToMany(() => Attribute, (attribute) => attribute.categories)
    @JoinTable({ name: 'category_attributes' })
      attributes!: Attribute[]

    @OneToMany(() => Item, (item) => item.category)
      items!: Item[]
}
