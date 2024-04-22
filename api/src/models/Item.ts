import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
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

    @ManyToOne(() => ItemType, type => type.items)
    @JoinColumn({ name: 'type' }) // This line names the column as 'type'
    type!: ItemType;

    @OneToMany(() => RatedItem, ratedItem => ratedItem.item)
    ratings!: RatedItem[];

    @OneToMany(() => CategoryItem, categoryItem => categoryItem.item)
    categories!: CategoryItem[];
}