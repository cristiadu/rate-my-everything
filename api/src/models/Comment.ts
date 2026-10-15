import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm'
import Item, { ItemReference } from '@/models/Item'
import User, { UserSummary } from '@/models/User'

/** Longest comment body accepted, in characters. */
export const MAX_COMMENT_LENGTH = 2000

/** A comment as the API returns it, with the id of its item and its author. */
export interface CommentResponse extends Pick<Comment, 'id' | 'body' | 'createdAt'> {
  item: ItemReference
  user: UserSummary
}

/** Fields accepted when posting a comment. */
export interface CommentInput extends Pick<Comment, 'body'> {}

/** One message in the discussion thread of an item; removed with its item or its author. */
@Entity()
export default class Comment {
  /**
   * @isInt
   * @example 31
   */
  @PrimaryGeneratedColumn()
    id!: number

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
    item!: Item

  /** Author of the comment; only its id and username are returned by the API. */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
    user!: User

  // tsoa reads @maxLength as a literal, so keep it equal to MAX_COMMENT_LENGTH
  /**
   * Text of the comment.
   * @maxLength 2000
   * @example "The remaster sounds much better than the original pressing."
   */
  @Column('varchar', { length: MAX_COMMENT_LENGTH })
    body!: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date
}
