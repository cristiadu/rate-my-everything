import {
  Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm'
import AttributeValue from '@/models/AttributeValue'
import AttributeValueType from '@/models/AttributeValueType'
import Category from '@/models/Category'

/** An attribute as the API returns it, without its categories and values. */
export interface AttributeResponse extends Pick<Attribute, 'id' | 'name' | 'valueType' | 'currencyCode'> {}

/** An attribute given by its id. */
export interface AttributeReference extends Pick<Attribute, 'id'> {}

/** Fields accepted when creating an attribute. */
export interface AttributeInput extends Pick<Attribute, 'name' | 'valueType' | 'currencyCode'> {}

/** Fields accepted when changing an attribute; fields left out keep their value. */
export interface AttributeUpdate extends Partial<AttributeInput> {}

@Entity()
export default class Attribute {
    /**
     * @isInt
     * @example 3
     */
    @PrimaryGeneratedColumn()
      id!: number

    /** @example "Year published" */
    @Column('varchar')
      name!: string

    @Column('varchar')
      valueType!: AttributeValueType

    /**
     * ISO 4217 code of the currency the amounts are in; required for currency attributes, empty for other value types.
     * @example "USD"
     */
    @Column('varchar', { nullable: true })
      currencyCode?: string | null

    @ManyToMany(() => Category, (category) => category.attributes)
      categories!: Category[]

    @OneToMany(() => AttributeValue, (attributeValue) => attributeValue.attribute)
      values!: AttributeValue[]
}
