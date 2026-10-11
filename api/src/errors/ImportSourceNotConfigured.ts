import ImportSource from '@/models/ImportSource'

/** Raised when an import source is used but its API key environment variable is not set. */
export class ImportSourceNotConfigured extends Error {
    constructor(source: ImportSource) {
        super(`Importing from ${source} is not configured on this server`)
        this.name = 'ImportSourceNotConfigured'
    }
}
