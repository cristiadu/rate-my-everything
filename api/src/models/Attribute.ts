import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import AttributeValue from "./AttributeValue";
import Category from "./Category";

@Entity()
export default class Attribute {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    valueType!: string;

    @ManyToMany(() => Category, category => category.attributes)
    categories!: Category[];
    
    @OneToMany(() => AttributeValue, attributeValue => attributeValue.attribute)
    values!: AttributeValue[];
}