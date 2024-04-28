import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm'
import Item from './Item'
import Attribute from './Attribute'

@Entity()
export default class AttributeValue {
  @PrimaryGeneratedColumn()
    id!: number

  @ManyToOne(() => Item, (item) => item.attributes)
  @JoinColumn({ name: 'item_id' }) // This line names the column as 'item_id '
    item!: Item

  @ManyToOne(() => Attribute, (attribute) => attribute.values)
  @JoinColumn({ name: 'attribute_id' }) // This line names the column as 'attribute_id'
    attribute!: Attribute

  @Column()
    value!: string
}
