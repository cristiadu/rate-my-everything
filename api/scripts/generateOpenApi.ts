import { writeFileSync } from 'fs'
import path from 'path'
import { stringify } from 'yaml'
import { buildOpenApiDocument, generateSchemas } from '@/helpers/OpenApiHelper'
import { API_OPERATIONS } from '@/routes/ApiOperations'
import { version } from '../package.json'

/** Where the OpenAPI document is written; the UI generates its API client from it. */
const OPENAPI_FILE = path.resolve(__dirname, '../openapi.yaml')

writeFileSync(OPENAPI_FILE, stringify(buildOpenApiDocument(API_OPERATIONS, generateSchemas(), version), { lineWidth: 0 }))
