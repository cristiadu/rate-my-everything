/** Thrown when a password reset token is unknown, already used or expired. */
export class InvalidResetToken extends Error {
    constructor(message: string = 'This reset link is invalid or has expired') {
        super(message)
        this.name = 'InvalidResetToken'
    }
}
