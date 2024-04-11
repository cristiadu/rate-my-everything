import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany } from "typeorm";
import RatedItem from "./RatedItem";

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    username!: string;

    @Column()
    email!: string;

    @Column()
    password!: string;

    @OneToMany(() => RatedItem, ratedItem => ratedItem.user)
    ratedItems!: RatedItem[];
}
