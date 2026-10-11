import {
  Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm'
import AttributeValue from '@/models/AttributeValue'
import Category from '@/models/Category'
import AttributeValueType from '@/models/AttributeValueType'

@Entity()
export default class Attribute {
    @PrimaryGeneratedColumn()
      id!: number

    @Column('varchar')
      name!: string

    @Column('varchar')
      valueType!: AttributeValueType

    @ManyToMany(() => Category, (category) => category.attributes)
      categories!: Category[]

    @OneToMany(() => AttributeValue, (attributeValue) => attributeValue.attribute)
      values!: AttributeValue[]
}
