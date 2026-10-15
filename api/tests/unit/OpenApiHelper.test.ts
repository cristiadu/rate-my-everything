import { beforeAll, describe, it, expect } from 'vitest'
import { OpenAPIV3_1 } from 'openapi-types'
import { Validator } from '@seriousme/openapi-schema-validator'
import { buildOpenApiDocument, generateSchemas } from '@/helpers/OpenApiHelper'
import { API_OPERATIONS } from '@/routes/ApiOperations'
import { TEST_OPERATIONS } from '@@/testutils/common/OpenApi'

/** Generating schemas runs the TypeScript compiler over the models, so it takes a few seconds, in milliseconds. */
const SCHEMA_GENERATION_TIMEOUT_MS = 60000

describe('OpenApiHelper', () => {
  let schemas: Record<string, OpenAPIV3_1.SchemaObject>

  beforeAll(() => {
    schemas = generateSchemas()
  }, SCHEMA_GENERATION_TIMEOUT_MS)

  describe('generateSchemas', () => {
    it('names schemas after the models and inlines utility types', () => {
      // GIVEN the schemas generated from the models
      // WHEN their names are listed
      const schemaNames = Object.keys(schemas)

      // THEN the named models are there and no utility type such as Pick<...> is
      expect(schemaNames).toEqual(
        expect.arrayContaining(['APIError', 'AttributeValueType', 'CategoryResponse', 'ItemResponse', 'UserRole']),
      )
      expect(schemaNames.filter((schemaName) => schemaName.includes('<'))).toEqual([])
    })

    it('describes a category with its attributes by reference', () => {
      // GIVEN the schemas generated from the models
      // WHEN the category response schema is read
      const categoryResponse = schemas.CategoryResponse

      // THEN its attributes reference the attribute schema and its relations to items are left out
      expect(categoryResponse.properties?.attributes).toEqual({ type: 'array', items: { $ref: '#/components/schemas/AttributeResponse' } })
      expect(categoryResponse.properties?.items).toBeUndefined()
      expect(categoryResponse.required).toEqual(['attributes', 'id', 'name'])
    })

    it('lists the values of an enum', () => {
      // GIVEN the schemas generated from the models
      // WHEN the attribute value type schema is read
      const attributeValueType = schemas.AttributeValueType

      // THEN it holds the enum values
      expect(attributeValueType).toEqual({
        type: 'string',
        enum: ['string', 'number', 'boolean', 'date'],
        'x-enum-varnames': ['STRING', 'NUMBER', 'BOOLEAN', 'DATE'],
        description: 'Kinds of value an attribute holds.',
      })
    })
  })

  describe('buildOpenApiDocument', () => {
    it('lets public operations skip the bearer token', () => {
      // GIVEN a public operation
      // WHEN the document is built
      const document = buildOpenApiDocument(TEST_OPERATIONS, schemas, '1.0.0')

      // THEN it has no security requirement and only its own responses plus the internal error
      const login = document.paths?.['/login']?.post
      expect(login?.security).toEqual([])
      expect(Object.keys(login?.responses ?? {})).toEqual(['200', '500'])
      expect(login?.requestBody).toEqual({
        required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
      })
    })

    it('adds the authentication responses and list bodies to protected operations', () => {
      // GIVEN a protected operation that answers with a list
      // WHEN the document is built
      const document = buildOpenApiDocument(TEST_OPERATIONS, schemas, '1.0.0')

      // THEN it inherits the bearer token requirement and answers 401 and 403
      const getRatingsByItem = document.paths?.['/ratings/item/{item_id}']?.get
      expect(document.security).toEqual([{ bearerAuth: [] }])
      expect(getRatingsByItem?.security).toBeUndefined()
      expect(Object.keys(getRatingsByItem?.responses ?? {})).toEqual(['200', '401', '403', '500'])
      expect(getRatingsByItem?.responses?.['200']).toEqual({
        description: 'Ratings',
        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RatedItemResponse' } } } },
      })
      expect(getRatingsByItem?.parameters).toEqual([
        { name: 'item_id', in: 'path', description: 'Id of the item', required: true, schema: { type: 'integer' } },
      ])
    })

    it('builds a valid OpenAPI document for every API operation', async () => {
      // GIVEN every operation the API serves
      // WHEN the document is built
      const document = buildOpenApiDocument(API_OPERATIONS, schemas, '1.0.0')

      // THEN it passes the OpenAPI schema validation
      const result = await new Validator().validate(document)
      expect(result).toEqual({ valid: true })
    })

    it('describes the API and its tags', () => {
      // GIVEN operations tagged Login and Ratings
      // WHEN the document is built
      const document = buildOpenApiDocument(TEST_OPERATIONS, schemas, '2.3.4')

      // THEN it carries the OpenAPI version, the API version, the base path and the sorted tags
      expect(document.openapi).toBe('3.2.0')
      expect(document.servers).toEqual([{ url: '/api' }])
      expect(document.info).toEqual(expect.objectContaining({ title: 'Rate My Everything API', version: '2.3.4' }))
      expect(document.tags).toEqual([{ name: 'Login' }, { name: 'Ratings' }])
    })
  })
})
