import { Entity, ManyToMany, OneToMany, PrimaryColumn } from "typeorm"
import Attribute from "./Attribute"
import Item from "./Item"

@Entity()
export default class Category {
    @PrimaryColumn()
    name!: string

    @ManyToMany(() => Attribute, (attribute) => attribute.categories)
    attributes!: Attribute[]

    @OneToMany(() => Item, (item) => item.category)
    items!: Item[]
}
