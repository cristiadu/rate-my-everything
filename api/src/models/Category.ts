import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import ItemType from "./ItemType";
import CategoryItem from "./CategoryItem";

@Entity()
export default class Category {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    valueType!: string;

    @ManyToMany(() => ItemType, itemType => itemType.categories)
    itemTypes!: ItemType[];
    
    @OneToMany(() => CategoryItem, categoryItem => categoryItem.item)
    items!: CategoryItem[];
}