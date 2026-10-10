/** Raised when a category references attribute ids that do not exist. */
export class UnknownAttributes extends Error {
    constructor(attributeIds: number[]) {
        super(`Unknown attribute ids: ${attributeIds.join(', ')}`)
        this.name = 'UnknownAttributes'
    }
}
