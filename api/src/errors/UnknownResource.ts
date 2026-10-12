/** Raised when an entity relation references a resource that does not exist. */
export class UnknownResource extends Error {
    /** Resource name associated with the missing identifier. */
    public readonly resource: string

    constructor(resource: string, id: number | undefined) {
        super(`Unknown ${resource} id: ${id}`)
        this.name = 'UnknownResource'
        this.resource = resource
    }
}
