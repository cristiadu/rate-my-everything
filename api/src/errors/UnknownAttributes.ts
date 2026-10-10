export class UnknownAttributes extends Error {
    constructor(attributeIds: number[]) {
        super(`Unknown attribute ids: ${attributeIds.join(', ')}`)
        this.name = 'UnknownAttributes'
    }
}
