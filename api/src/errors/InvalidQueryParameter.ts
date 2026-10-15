/** Raised when a query parameter holds a value the endpoint cannot use. */
export class InvalidQueryParameter extends Error {
    constructor(parameter: string, expected: string) {
        super(`Invalid value for ${parameter}: it must be ${expected}`)
        this.name = 'InvalidQueryParameter'
    }
}
