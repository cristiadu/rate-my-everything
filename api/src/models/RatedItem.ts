import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Min, Max } from 'class-validator'
import { User } from './User'

@Entity()
export default class RatedItem {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  item_id!: number

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  @Min(0.0)
  @Max(10.0)
  rating!: number

  @ManyToOne(() => User, user => user.ratedItems)
  @JoinColumn({ name: 'user_id' }) // This line names the column as 'user_id'
  user!: User;

  @Column({ nullable: true })
  notes!: string
}
