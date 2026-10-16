/** Raised when a user changes a rating they did not give, or deletes one without being its author or a moderator. */
export class RatingNotOwned extends Error {
    constructor(ratingId: number) {
        super(`Only the author can change rating ${ratingId}, and only the author or a moderator can delete it`)
        this.name = 'RatingNotOwned'
    }
}
