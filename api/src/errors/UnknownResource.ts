/** Raised when an entity relation or an external service references a resource that does not exist. */
export class UnknownResource extends Error {
    /** Resource name associated with the missing identifier. */
    public readonly resource: string

    /** Missing resource identifiers associated with this error. */
    public readonly ids: (number | string)[] | undefined

    constructor(resource: string, ids: number | number[] | string | undefined) {
        const isList = Array.isArray(ids)
        const normalizedIds = isList ? ids : ids === undefined ? undefined : [ids]
        super(`Unknown ${resource} ${isList ? 'ids' : 'id'}: ${normalizedIds?.join(', ')}`)
        this.name = 'UnknownResource'
        this.resource = resource
        this.ids = normalizedIds
    }
}
