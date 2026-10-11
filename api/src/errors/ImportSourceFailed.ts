import ImportSource from '@/models/ImportSource'

/** Raised when an external service answers an import request with an unexpected error. */
export class ImportSourceFailed extends Error {
    constructor(source: ImportSource, status: number) {
        super(`${source} answered the import request with status ${status}`)
        this.name = 'ImportSourceFailed'
    }
}
