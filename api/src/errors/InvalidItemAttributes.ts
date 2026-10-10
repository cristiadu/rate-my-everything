/** Thrown when an item names a missing category or attributes that its category does not define. */
export class InvalidItemAttributes extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'InvalidItemAttributes'
    }
}
