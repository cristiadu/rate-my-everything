import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm'
import Item, { ItemReference } from '@/models/Item'
import Attribute, { AttributeReference, AttributeResponse } from '@/models/Attribute'

/** An attribute value as the attribute values endpoints return it, without its item and attribute. */
export interface AttributeValueResponse extends Pick<AttributeValue, 'id' | 'value'> {}

/** A value an item holds for one attribute, returned with that attribute. */
export interface ItemAttributeValue extends AttributeValueResponse {
  attribute: AttributeResponse
}

/** Fields accepted by the attribute values endpoints, with the item and attribute given by id. */
export interface AttributeValueRecordInput extends Pick<AttributeValue, 'value'> {
  item: ItemReference
  attribute: AttributeReference
}

@Entity()
export default class AttributeValue {
  /**
   * @isInt
   * @example 21
   */
  @PrimaryGeneratedColumn()
    id!: number

  @ManyToOne(() => Item, (item) => item.attributes, { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
  @JoinColumn({ name: 'item_id' })
    item!: Item

  @ManyToOne(() => Attribute, (attribute) => attribute.values)
  @JoinColumn({ name: 'attribute_id' })
    attribute!: Attribute

  /** @example "1965" */
  @Column('varchar')
    value!: string
}
