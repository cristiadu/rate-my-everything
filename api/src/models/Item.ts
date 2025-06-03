import {
  Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm'
import RatedItem from '@/models/RatedItem'
import Category from '@/models/Category'
import AttributeValue from '@/models/AttributeValue'

@Entity()
export default class Item {
    @PrimaryGeneratedColumn()
      id!: number

    @Column()
      name!: string

    @Column()
      description!: string

    @ManyToOne(() => Category, (category) => category.items)
    @JoinColumn({ name: 'category' }) // This line names the column as 'category'
      category!: Category

    @OneToMany(() => RatedItem, (ratedItem) => ratedItem.item)
      ratings!: RatedItem[]

    @OneToMany(() => AttributeValue, (attributeValue) => attributeValue.item)
      attributes!: AttributeValue[]
}
