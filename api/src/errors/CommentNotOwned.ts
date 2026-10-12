/** Raised when a user who neither wrote a comment nor moderates tries to delete it. */
export class CommentNotOwned extends Error {
    constructor(commentId: number) {
        super(`Only the author or a moderator can delete comment ${commentId}`)
        this.name = 'CommentNotOwned'
    }
}
