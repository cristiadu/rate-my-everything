import {
  Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm'
import Attribute from '@/models/Attribute'
import Item from '@/models/Item'

@Entity()
export default class Category {
    @PrimaryGeneratedColumn()
      id!: number
  
    @Column('varchar', { unique: true })
      name!: string
    
    @Column('varchar', { nullable: true })
      description?: string

    @ManyToMany(() => Attribute, (attribute) => attribute.categories)
      attributes!: Attribute[]

    @OneToMany(() => Item, (item) => item.category)
      items!: Item[]
}
