/** Raised when an item references a category id that does not exist. */
export class UnknownCategory extends Error {
    constructor(categoryId: number | undefined) {
        super(`Unknown category id: ${categoryId}`)
        this.name = 'UnknownCategory'
    }
}
