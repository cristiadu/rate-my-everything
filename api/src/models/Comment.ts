import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm'
import Item from '@/models/Item'
import User from '@/models/User'

/** Longest comment body accepted, in characters. */
export const MAX_COMMENT_LENGTH = 2000

/** One message in the discussion thread of an item; removed with its item or its author. */
@Entity()
export default class Comment {
  @PrimaryGeneratedColumn()
    id!: number

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
    item!: Item

  /** Author of the comment; only its id and username are returned by the API. */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
    user!: User

  @Column('varchar', { length: MAX_COMMENT_LENGTH })
    body!: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date
}
