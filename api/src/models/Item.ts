import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import RatedItem from "./RatedItem";
import ItemType from "./ItemType";
import CategoryItem from "./CategoryItem";

@Entity()
export default class Item {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    description!: string;

    @Column()
    type!: ItemType;

    @OneToMany(() => RatedItem, ratedItem => ratedItem.item)
    ratings!: RatedItem[];

    @OneToMany(() => CategoryItem, categoryItem => categoryItem.item)
    categories!: CategoryItem[];
}