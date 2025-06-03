import {
  Entity, ManyToMany, OneToMany, PrimaryColumn,
} from 'typeorm'
import Attribute from '@/models/Attribute'
import Item from '@/models/Item'

@Entity()
export default class Category {
    @PrimaryColumn()
      name!: string

    @ManyToMany(() => Attribute, (attribute) => attribute.categories)
      attributes!: Attribute[]

    @OneToMany(() => Item, (item) => item.category)
      items!: Item[]
}
