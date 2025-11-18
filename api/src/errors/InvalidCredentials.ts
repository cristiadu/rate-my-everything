export class InvalidCredentials extends Error {
    constructor(message: string = 'Invalid credentials provided') {
        super(message)
        this.name = 'InvalidCredentials'
    }
}