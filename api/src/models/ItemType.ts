import { Entity, ManyToMany, PrimaryColumn } from "typeorm";
import Category from "./Category";

@Entity()
export default class ItemType {
    @PrimaryColumn()
    name!: string;

    @ManyToMany(() => Category, category => category.itemTypes)
    categories!: Category[];
}
