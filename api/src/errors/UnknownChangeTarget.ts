import ChangeRequestTarget from '@/models/ChangeRequestTarget'

/** Raised when a change request points at an item or category that does not exist. */
export class UnknownChangeTarget extends Error {
    constructor(targetType: ChangeRequestTarget, targetId: number | null) {
        super(`Unknown ${targetType} id: ${targetId}`)
        this.name = 'UnknownChangeTarget'
    }
}
