import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Min, Max } from 'class-validator'
import User from './User'
import Item from './Item'
import Category from './Category'

@Entity()
export default class CategoryItem {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => Item, item => item.categories)
  @JoinColumn({ name: 'item_id' }) // This line names the column as 'item_id '
  item!: Item

  @ManyToOne(() => Category, category => category.items)
  @JoinColumn({ name: 'category_id' }) // This line names the column as 'user_id'
  category!: Category;

  @Column()
  value!: string
}
