/** Raised when the user or playlist to import from does not exist on the external service. */
export class ImportNotFound extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ImportNotFound'
    }
}
