import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm'
import Item from '@/models/Item'
import Attribute, { AttributeResponse } from '@/models/Attribute'

/** An attribute value as the attribute values endpoints return it, without its item and attribute. */
export type AttributeValueResponse = Pick<AttributeValue, 'id' | 'value'>

/** A value an item holds for one attribute, returned with that attribute. */
export type ItemAttributeValue = AttributeValueResponse & { attribute: AttributeResponse }

/** Fields accepted by the attribute values endpoints, with the item and attribute given by id. */
export type AttributeValueRecordInput = Pick<AttributeValue, 'value'> & { item: Pick<Item, 'id'>, attribute: Pick<Attribute, 'id'> }

@Entity()
export default class AttributeValue {
  @PrimaryGeneratedColumn()
    id!: number

  @ManyToOne(() => Item, (item) => item.attributes, { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
  @JoinColumn({ name: 'item_id' })
    item!: Item

  @ManyToOne(() => Attribute, (attribute) => attribute.values)
  @JoinColumn({ name: 'attribute_id' })
    attribute!: Attribute

  @Column('varchar')
    value!: string
}
