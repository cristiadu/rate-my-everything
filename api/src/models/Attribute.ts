import {
  Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm'
import AttributeValue from '@/models/AttributeValue'
import AttributeValueType from '@/models/AttributeValueType'
import Category from '@/models/Category'

/** An attribute as the API returns it, without its categories and values. */
export type AttributeResponse = Omit<Attribute, 'categories' | 'values'>

/** Fields accepted when creating or updating an attribute. */
export type AttributeInput = Pick<Attribute, 'name' | 'valueType'>

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
