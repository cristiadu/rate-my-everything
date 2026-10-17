/** Raised when a value does not fit its attribute's value type, or a currency attribute has no known currency code. */
export class InvalidAttributeValue extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'InvalidAttributeValue'
    }
}
