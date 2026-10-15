import path from 'path'
import { createGenerator } from 'ts-json-schema-generator'
import { OpenAPIV3_1 } from 'openapi-types'
import { API_BASE_PATH, ApiOperation, ApiResponse, JsonObject, JsonValue, OPENAPI_VERSION, SchemaName } from '@/models/OpenApi'
import AttributeValueType from '@/models/AttributeValueType'
import ErrorCode from '@/errors/ErrorCode'
import ImportSource from '@/models/ImportSource'
import UserRole from '@/models/UserRole'

/** Type that lists every documented schema; it is a lookup table and not a schema itself. */
const SCHEMA_INDEX_TYPE = 'ApiSchemas'

/** File that declares the schema index type. */
const SCHEMA_INDEX_FILE = path.resolve(__dirname, '../models/OpenApi.ts')

/** TypeScript configuration used to resolve the models' imports. */
const TSCONFIG_FILE = path.resolve(__dirname, '../../tsconfig.json')

/** Start of a reference to another schema of the OpenAPI document. */
const SCHEMA_REFERENCE_PREFIX = '#/components/schemas/'

/** Enums whose member names are published with their values, so generated clients can use names such as `UserRole.ADMIN`. */
const NAMED_ENUMS: Record<string, Record<string, string>> = { AttributeValueType, ErrorCode, ImportSource, UserRole }

/** Name of the bearer token security scheme every protected operation requires. */
const BEARER_AUTH = 'bearerAuth'

/** Media type of every request and response body. */
const JSON_MEDIA_TYPE = 'application/json'

/** Responses every protected operation can answer with, from the authentication filter. */
const AUTH_RESPONSES: Record<number, ApiResponse> = {
  401: { description: 'The bearer token is missing or invalid', schema: 'APIError' },
  403: { description: 'The signed-in user\'s roles do not allow this operation', schema: 'APIError' },
}

/** Response every operation answers with when something unexpected fails. */
const INTERNAL_ERROR_RESPONSE: ApiResponse = { description: 'Something unexpected failed', schema: 'APIError' }

/** Builds a reference to a schema of the OpenAPI document. */
const schemaReference = (schema: SchemaName): OpenAPIV3_1.ReferenceObject => ({ $ref: `${SCHEMA_REFERENCE_PREFIX}${schema}` })

/** Whether a generated schema stands for a TypeScript utility type, such as `Pick<Item,"id">`, instead of a named model. */
const isUtilityTypeName = (schemaName: string): boolean => schemaName.includes('<')

/** Replaces references to utility type schemas with the schemas themselves, keeping keywords next to the reference such as description. */
const inlineUtilityTypes = (value: JsonValue, schemas: JsonObject): JsonValue => {
  if (Array.isArray(value)) {
    return value.map((item) => inlineUtilityTypes(item, schemas))
  }
  if (value === null || typeof value !== 'object') {
    return value
  }

  const { $ref: reference, ...keywords } = value
  const inlinedKeywords: JsonObject = Object.fromEntries(
    Object.entries(keywords).map(([keyword, keywordValue]) => [keyword, inlineUtilityTypes(keywordValue, schemas)]),
  )
  if (typeof reference !== 'string') {
    return inlinedKeywords
  }

  const schemaName = decodeURIComponent(reference.slice(SCHEMA_REFERENCE_PREFIX.length))
  if (!isUtilityTypeName(schemaName)) {
    return { $ref: reference, ...inlinedKeywords }
  }
  return { ...(inlineUtilityTypes(schemas[schemaName], schemas) as JsonObject), ...inlinedKeywords }
}

/** Converts a documented response into an OpenAPI response, with a JSON body when it has a schema. */
const toResponseObject = ({ description, schema, isList }: ApiResponse): OpenAPIV3_1.ResponseObject => {
  if (!schema) {
    return { description }
  }

  const bodySchema: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject = isList
    ? { type: 'array', items: schemaReference(schema) }
    : schemaReference(schema)
  return { description, content: { [JSON_MEDIA_TYPE]: { schema: bodySchema } } }
}

/** Converts an operation into an OpenAPI operation, adding the auth and internal error responses every handler shares. */
const toOperationObject = (operation: ApiOperation): OpenAPIV3_1.OperationObject => {
  const responses = {
    ...(operation.isPublic ? {} : AUTH_RESPONSES),
    500: INTERNAL_ERROR_RESPONSE,
    ...operation.responses,
  }

  return {
    operationId: operation.operationId,
    summary: operation.summary,
    tags: [operation.tag],
    ...(operation.isPublic ? { security: [] } : {}),
    ...(operation.parameters ? {
      parameters: operation.parameters.map((parameter) => ({
        name: parameter.name,
        in: parameter.location,
        description: parameter.description,
        required: parameter.isRequired,
        schema: parameter.schema ? schemaReference(parameter.schema) : { type: parameter.type },
      })),
    } : {}),
    ...(operation.requestBody ? {
      requestBody: { required: true, content: { [JSON_MEDIA_TYPE]: { schema: schemaReference(operation.requestBody) } } },
    } : {}),
    responses: Object.fromEntries(
      Object.entries(responses)
        .sort(([status], [otherStatus]) => Number(status) - Number(otherStatus))
        .map(([status, response]) => [status, toResponseObject(response)]),
    ),
  }
}

/**
 * Generates a JSON schema for every type listed in `ApiSchemas`, and for the named types they use, from the TypeScript models.
 * The schemas reference each other through `#/components/schemas/`; utility types such as `Pick` are inlined.
 */
export const generateSchemas = (): Record<string, OpenAPIV3_1.SchemaObject> => {
  const generator = createGenerator({
    path: SCHEMA_INDEX_FILE,
    tsconfig: TSCONFIG_FILE,
    type: SCHEMA_INDEX_TYPE,
    expose: 'all',
    skipTypeCheck: true,
    additionalProperties: true,
  })
  const definitions = generator.createSchema(SCHEMA_INDEX_TYPE).definitions ?? {}
  const schemas: JsonObject = JSON.parse(JSON.stringify(definitions).replaceAll('#/definitions/', SCHEMA_REFERENCE_PREFIX))
  return Object.fromEntries(
    Object.entries(schemas)
      .filter(([schemaName]) => schemaName !== SCHEMA_INDEX_TYPE && !isUtilityTypeName(schemaName))
      .sort(([schemaName], [otherSchemaName]) => schemaName.localeCompare(otherSchemaName))
      .map(([schemaName, schema]) => {
        const enumMembers = NAMED_ENUMS[schemaName]
        const namedSchema = enumMembers ? { ...(schema as JsonObject), 'x-enum-varnames': Object.keys(enumMembers) } : schema
        return [schemaName, inlineUtilityTypes(namedSchema, schemas) as OpenAPIV3_1.SchemaObject]
      }),
  )
}

/** Builds the OpenAPI document of the API from its operations and the schemas of their bodies. */
export const buildOpenApiDocument = (
  operations: ApiOperation[],
  schemas: Record<string, OpenAPIV3_1.SchemaObject>,
  apiVersion: string,
): OpenAPIV3_1.Document => {
  const paths: OpenAPIV3_1.PathsObject = {}
  operations.forEach((operation) => {
    paths[operation.path] = { ...paths[operation.path], [operation.method]: toOperationObject(operation) }
  })

  return {
    openapi: OPENAPI_VERSION,
    info: {
      title: 'Rate My Everything API',
      version: apiVersion,
      description: 'Rate interests, group them in categories described by attributes, and discuss them.',
    },
    servers: [{ url: API_BASE_PATH }],
    tags: [...new Set(operations.map((operation) => operation.tag))].sort().map((name) => ({ name })),
    security: [{ [BEARER_AUTH]: [] }],
    paths,
    components: {
      securitySchemes: { [BEARER_AUTH]: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas,
    },
  }
}
