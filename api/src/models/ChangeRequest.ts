import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm'
import User, { UserSummary } from '@/models/User'
import { ItemInput } from '@/models/Item'
import { CategoryInput } from '@/models/Category'
import ChangeRequestAction from '@/models/ChangeRequestAction'
import ChangeRequestStatus from '@/models/ChangeRequestStatus'
import ChangeRequestTarget from '@/models/ChangeRequestTarget'

/** Actions users may propose for each target; new interests are added directly, so items only take updates. */
export const SUPPORTED_ACTIONS: Record<ChangeRequestTarget, ChangeRequestAction[]> = {
  [ChangeRequestTarget.ITEM]: [ChangeRequestAction.UPDATE],
  [ChangeRequestTarget.CATEGORY]: [ChangeRequestAction.CREATE, ChangeRequestAction.UPDATE, ChangeRequestAction.DELETE],
}

/** Fields a change request proposes, in the same shape the items or categories API accepts. */
export type ChangeRequestChanges = ItemInput | CategoryInput

/** Fields accepted when a user submits a change request. */
export type ChangeRequestInput = {
  targetType: ChangeRequestTarget
  action: ChangeRequestAction
  targetId?: number
  changes?: ChangeRequestChanges
}

/** Fields accepted when a moderator approves or rejects a change request. */
export type ChangeRequestReview = {
  reviewNote?: string
}

/** A change request as the API returns it, with the requester and reviewer reduced to their id and username. */
export type ChangeRequestResponse = Omit<ChangeRequest, 'requestedBy' | 'reviewedBy'> & {
  requestedBy: UserSummary
  reviewedBy: UserSummary | null
}

/** A user's proposed change to shared data, applied only once a moderator approves it. */
@Entity()
export default class ChangeRequest {
    @PrimaryGeneratedColumn()
      id!: number

    @Column('varchar')
      targetType!: ChangeRequestTarget

    @Column('varchar')
      action!: ChangeRequestAction

    /** Id of the item or category being changed; empty when creating one. */
    @Column('int', { nullable: true })
      targetId!: number | null

    /** Name of the target when the request was made, so moderators can tell what it is about. */
    @Column('varchar', { nullable: true })
      targetName!: string | null

    @Column('jsonb', { nullable: true })
      changes!: ChangeRequestChanges | null

    @Column('varchar', { default: ChangeRequestStatus.PENDING })
      status!: ChangeRequestStatus

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'requested_by' })
      requestedBy!: User

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reviewed_by' })
      reviewedBy!: User | null

    @Column('varchar', { nullable: true })
      reviewNote!: string | null

    @CreateDateColumn()
      createdAt!: Date

    @Column('timestamp', { nullable: true })
      reviewedAt!: Date | null
}
