import {
  Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm'
import Attribute from '@/models/Attribute'
import Item from '@/models/Item'

/** Fields accepted when creating or updating a category, with linked attributes given by id. */
export type CategoryInput = Partial<Pick<Category, 'name' | 'description'>> & { attributeIds?: number[] }

@Entity()
export default class Category {
    @PrimaryGeneratedColumn()
      id!: number
  
    @Column('varchar', { unique: true })
      name!: string
    
    @Column('varchar', { nullable: true })
      description?: string

    @ManyToMany(() => Attribute, (attribute) => attribute.categories)
    @JoinTable({ name: 'category_attributes' })
      attributes!: Attribute[]

    @OneToMany(() => Item, (item) => item.category)
      items!: Item[]
}
