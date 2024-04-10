import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { Min, Max } from 'class-validator'

@Entity()
export default class RatedItem {
    @PrimaryGeneratedColumn()
      id!: number

    @Column()
      item_id!: number

    @Column({ type: 'decimal', precision: 2, scale: 2 })
    @Min(0.0)
    @Max(10.0)
      rating!: number

    @Column()
      user_id!: number

    @Column({ nullable: true })
      notes!: string
}
