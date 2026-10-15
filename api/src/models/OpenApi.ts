import APIError, { HttpStatusCode } from '@/models/APIError'
import { AttributeInput, AttributeResponse } from '@/models/Attribute'
import { AttributeValueRecordInput, AttributeValueResponse } from '@/models/AttributeValue'
import { CategoryInput, CategoryResponse } from '@/models/Category'
import { CommentInput, CommentResponse } from '@/models/Comment'
import { Health } from '@/models/Health'
import { ImportedItem } from '@/models/ImportedItem'
import ImportSource from '@/models/ImportSource'
import { ItemInput, ItemResponse } from '@/models/Item'
import { NewRatingInput, RatedItemResponse, RatingInput } from '@/models/RatedItem'
import { LoginInput, RegisterInput, UserInput, UserResponse, UserTokenResponse } from '@/models/User'

/** OpenAPI version the generated document follows. */
export const OPENAPI_VERSION = '3.2.0'

/** Path every API route starts with; documented operation paths are relative to it. */
export const API_BASE_PATH = '/api'

/** Every request and response body the API documents, by its schema name in the OpenAPI document. */
export type ApiSchemas = {
  APIError: APIError
  AttributeInput: AttributeInput
  AttributeResponse: AttributeResponse
  AttributeValueRecordInput: AttributeValueRecordInput
  AttributeValueResponse: AttributeValueResponse
  CategoryInput: CategoryInput
  CategoryResponse: CategoryResponse
  CommentInput: CommentInput
  CommentResponse: CommentResponse
  Health: Health
  ImportedItem: ImportedItem
  ImportSource: ImportSource
  ItemInput: ItemInput
  ItemResponse: ItemResponse
  LoginInput: LoginInput
  NewRatingInput: NewRatingInput
  RatedItemResponse: RatedItemResponse
  RatingInput: RatingInput
  RegisterInput: RegisterInput
  UserInput: UserInput
  UserResponse: UserResponse
  UserTokenResponse: UserTokenResponse
}

/** A value as it appears in a JSON document. */
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject

/** An object in a JSON document. */
export type JsonObject = { [key: string]: JsonValue }

/** Name of a schema the API documents. */
export type SchemaName = keyof ApiSchemas

/** HTTP methods the API serves, spelled as OpenAPI path item keys. */
export enum HttpMethod {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
}

/** Where a parameter is sent: in the path (`/items/{id}`) or in the query string (`?name=`). */
export enum ParameterLocation {
  PATH = 'path',
  QUERY = 'query',
}

/** JSON type of a parameter value; `integer` for ids, `string` for names and free text. */
export enum ParameterType {
  INTEGER = 'integer',
  STRING = 'string',
}

/** One path or query parameter of an operation. */
export type ApiParameter = {
  name: string
  location: ParameterLocation
  type: ParameterType
  description: string
  isRequired: boolean
  /** Schema of the value, when it is a documented type such as an enum; it takes the place of `type`. */
  schema?: SchemaName
}

/** One documented response of an operation; responses without a schema have no body. */
export type ApiResponse = {
  description: string
  schema?: SchemaName
  /** Whether the body is a list of `schema` instead of a single one. */
  isList?: boolean
}

/** One API operation: the HTTP method on a path, what it accepts and what it answers with each status code. */
export type ApiOperation = {
  method: HttpMethod
  /** Path below `API_BASE_PATH` in OpenAPI form, such as `/items/{id}` for `/api/items/:id`. */
  path: string
  operationId: string
  summary: string
  tag: string
  /** Whether the operation can be called without a bearer token. */
  isPublic?: boolean
  parameters?: ApiParameter[]
  requestBody?: SchemaName
  responses: Partial<Record<HttpStatusCode, ApiResponse>>
}
