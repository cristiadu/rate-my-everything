/** Raised when an entity relation references a resource that does not exist. */
export class UnknownResource extends Error {
    /** Resource name associated with the missing identifier. */
    public readonly resource: string

    /** Missing resource identifiers associated with this error. */
    public readonly ids: number[] | undefined

    constructor(resource: string, ids: number | number[] | undefined) {
        const normalizedIds = Array.isArray(ids) ? ids : ids === undefined ? undefined : [ids]
        super(`Unknown ${resource} ${normalizedIds && normalizedIds.length !== 1 ? 'ids' : 'id'}: ${normalizedIds?.join(', ')}`)
        this.name = 'UnknownResource'
        this.resource = resource
        this.ids = normalizedIds
    }
}
