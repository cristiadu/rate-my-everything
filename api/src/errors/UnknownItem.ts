/** Raised when a request references an item id that does not exist. */
export class UnknownItem extends Error {
    constructor(itemId: number) {
        super(`Unknown item id: ${itemId}`)
        this.name = 'UnknownItem'
    }
}
