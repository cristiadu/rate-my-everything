import { Entity, ManyToMany, OneToMany, PrimaryColumn } from "typeorm"
import Category from "./Category"
import Item from "./Item"

@Entity()
export default class ItemType {
    @PrimaryColumn()
    name!: string

    @ManyToMany(() => Category, (category) => category.itemTypes)
    categories!: Category[]

    @OneToMany(() => Item, (item) => item.type)
    items!: Item[]
}
