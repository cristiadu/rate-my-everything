export class ResourceAlreadyExists extends Error {
    constructor(resourceName: string, resourceId: string) {
        super(`Resource "${resourceName}" with id "${resourceId}" already exists`)
        this.name = 'ResourceAlreadyExists'
    }
}