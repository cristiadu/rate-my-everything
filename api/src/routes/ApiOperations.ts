import { ApiOperation, ApiParameter, ApiResponse, HttpMethod, ParameterLocation, ParameterType } from '@/models/OpenApi'

/** Path parameter for the numeric id of the resource the path names. */
const ID_PARAMETER: ApiParameter = {
  name: 'id', location: ParameterLocation.PATH, type: ParameterType.INTEGER, description: 'Id of the resource', isRequired: true,
}

/** Path parameter for the id of the item a list is about. */
const ITEM_ID_PARAMETER: ApiParameter = {
  name: 'item_id', location: ParameterLocation.PATH, type: ParameterType.INTEGER, description: 'Id of the item', isRequired: true,
}

/** Path parameter for the unique name of a category. */
const CATEGORY_NAME_PARAMETER: ApiParameter = {
  name: 'name', location: ParameterLocation.PATH, type: ParameterType.STRING, description: 'Name of the category', isRequired: true,
}

/** Query parameter for the name to find likely duplicates of. */
const SIMILAR_NAME_PARAMETER: ApiParameter = {
  name: 'name', location: ParameterLocation.QUERY, type: ParameterType.STRING, description: 'Name to compare against', isRequired: true,
}

/** Response of a delete: nothing is returned. */
const DELETED: ApiResponse = { description: 'Deleted' }

/** Response when a body or query value is missing or invalid. */
const VALIDATION_ERROR: ApiResponse = { description: 'A required value is missing or invalid', schema: 'APIError' }

/** Response when the path names a resource that does not exist. */
const NOT_FOUND: ApiResponse = { description: 'The resource does not exist', schema: 'APIError' }

/** Response when the body refers to a resource that does not exist or conflicts with one that does. */
const UNPROCESSABLE: ApiResponse = { description: 'The body refers to unknown or conflicting resources', schema: 'APIError' }

/** Every operation the API serves; the OpenAPI document is generated from this list and the schemas in `ApiSchemas`. */
export const API_OPERATIONS: ApiOperation[] = [
  {
    method: HttpMethod.POST, path: '/login', operationId: 'login', summary: 'Signs in and returns a bearer token', tag: 'Login',
    isPublic: true, requestBody: 'LoginInput',
    responses: {
      200: { description: 'Signed in', schema: 'UserTokenResponse' },
      400: { description: 'Username or password is missing', schema: 'APIError' },
      401: { description: 'Username or password is wrong', schema: 'APIError' },
    },
  },
  {
    method: HttpMethod.POST, path: '/login/register', operationId: 'register', summary: 'Creates an account', tag: 'Login',
    isPublic: true, requestBody: 'RegisterInput',
    responses: {
      201: { description: 'Account created', schema: 'UserResponse' },
      400: VALIDATION_ERROR,
      422: { description: 'The username is taken', schema: 'APIError' },
    },
  },
  {
    method: HttpMethod.GET, path: '/health', operationId: 'getHealth', summary: 'Reports whether the API and its database work',
    tag: 'Health',
    isPublic: true,
    responses: {
      200: { description: 'Every service is healthy', schema: 'Health' },
      500: { description: 'A service is unhealthy', schema: 'Health' },
    },
  },
  {
    method: HttpMethod.GET, path: '/users', operationId: 'getUsers', summary: 'Lists every user', tag: 'Users',
    responses: { 200: { description: 'Users', schema: 'UserResponse', isList: true } },
  },
  {
    method: HttpMethod.GET, path: '/users/username/{username}', operationId: 'getUserByUsername', summary: 'Finds a user by username',
    tag: 'Users',
    parameters: [{
      name: 'username', location: ParameterLocation.PATH, type: ParameterType.STRING, description: 'Username', isRequired: true,
    }],
    responses: { 200: { description: 'The user', schema: 'UserResponse' }, 404: NOT_FOUND },
  },
  {
    method: HttpMethod.GET, path: '/users/{id}', operationId: 'getUser', summary: 'Gets a user', tag: 'Users',
    parameters: [ID_PARAMETER],
    responses: { 200: { description: 'The user', schema: 'UserResponse' }, 404: NOT_FOUND },
  },
  {
    method: HttpMethod.POST, path: '/users', operationId: 'createUser', summary: 'Creates a user', tag: 'Users',
    requestBody: 'UserInput',
    responses: { 201: { description: 'User created', schema: 'UserResponse' } },
  },
  {
    method: HttpMethod.PUT, path: '/users/{id}', operationId: 'updateUser', summary: 'Changes a user', tag: 'Users',
    parameters: [ID_PARAMETER], requestBody: 'UserInput',
    responses: { 200: { description: 'User changed', schema: 'UserResponse' }, 404: NOT_FOUND },
  },
  {
    method: HttpMethod.DELETE, path: '/users/{id}', operationId: 'deleteUser', summary: 'Deletes a user', tag: 'Users',
    parameters: [ID_PARAMETER],
    responses: { 204: DELETED },
  },
  {
    method: HttpMethod.GET, path: '/attributes', operationId: 'getAttributes', summary: 'Lists every attribute', tag: 'Attributes',
    responses: { 200: { description: 'Attributes', schema: 'AttributeResponse', isList: true } },
  },
  {
    method: HttpMethod.GET, path: '/attributes/values', operationId: 'getAttributeValues', summary: 'Lists every attribute value',
    tag: 'Attributes',
    responses: { 200: { description: 'Attribute values', schema: 'AttributeValueResponse', isList: true } },
  },
  {
    method: HttpMethod.GET, path: '/attributes/values/{id}', operationId: 'getAttributeValue', summary: 'Gets an attribute value',
    tag: 'Attributes', parameters: [ID_PARAMETER],
    responses: { 200: { description: 'The attribute value', schema: 'AttributeValueResponse' }, 404: NOT_FOUND },
  },
  {
    method: HttpMethod.GET, path: '/attributes/{id}', operationId: 'getAttribute', summary: 'Gets an attribute', tag: 'Attributes',
    parameters: [ID_PARAMETER],
    responses: { 200: { description: 'The attribute', schema: 'AttributeResponse' }, 404: NOT_FOUND },
  },
  {
    method: HttpMethod.GET, path: '/attributes/{id}/values', operationId: 'getAttributeValuesByAttribute',
    summary: 'Lists the values items hold for an attribute', tag: 'Attributes', parameters: [ID_PARAMETER],
    responses: { 200: { description: 'Attribute values', schema: 'AttributeValueResponse', isList: true } },
  },
  {
    method: HttpMethod.POST, path: '/attributes', operationId: 'createAttribute', summary: 'Creates an attribute', tag: 'Attributes',
    requestBody: 'AttributeInput',
    responses: { 201: { description: 'Attribute created', schema: 'AttributeResponse' }, 400: VALIDATION_ERROR },
  },
  {
    method: HttpMethod.POST, path: '/attributes/values', operationId: 'createAttributeValue', summary: 'Creates an attribute value',
    tag: 'Attributes', requestBody: 'AttributeValueRecordInput',
    responses: { 201: { description: 'Attribute value created', schema: 'AttributeValueResponse' } },
  },
  {
    method: HttpMethod.PUT, path: '/attributes/{id}', operationId: 'updateAttribute', summary: 'Changes an attribute', tag: 'Attributes',
    parameters: [ID_PARAMETER], requestBody: 'AttributeInput',
    responses: { 200: { description: 'Attribute changed', schema: 'AttributeResponse' }, 400: VALIDATION_ERROR, 404: NOT_FOUND },
  },
  {
    method: HttpMethod.PUT, path: '/attributes/values/{id}', operationId: 'updateAttributeValue', summary: 'Changes an attribute value',
    tag: 'Attributes', parameters: [ID_PARAMETER], requestBody: 'AttributeValueRecordInput',
    responses: { 200: { description: 'Attribute value changed', schema: 'AttributeValueResponse' }, 404: NOT_FOUND },
  },
  {
    method: HttpMethod.DELETE, path: '/attributes/{id}', operationId: 'deleteAttribute', summary: 'Deletes an attribute', tag: 'Attributes',
    parameters: [ID_PARAMETER],
    responses: { 204: DELETED },
  },
  {
    method: HttpMethod.DELETE, path: '/attributes/values/{id}', operationId: 'deleteAttributeValue', summary: 'Deletes an attribute value',
    tag: 'Attributes', parameters: [ID_PARAMETER],
    responses: { 204: DELETED },
  },
  {
    method: HttpMethod.GET, path: '/categories', operationId: 'getCategories', summary: 'Lists every category with its attributes',
    tag: 'Categories',
    responses: { 200: { description: 'Categories', schema: 'CategoryResponse', isList: true } },
  },
  {
    method: HttpMethod.GET, path: '/categories/similar', operationId: 'getSimilarCategories',
    summary: 'Lists the categories whose name is likely a duplicate of a name, most similar first', tag: 'Categories',
    parameters: [SIMILAR_NAME_PARAMETER],
    responses: { 200: { description: 'Similar categories', schema: 'CategoryResponse', isList: true }, 400: VALIDATION_ERROR },
  },
  {
    method: HttpMethod.GET, path: '/categories/{name}', operationId: 'getCategory', summary: 'Gets a category by name', tag: 'Categories',
    parameters: [CATEGORY_NAME_PARAMETER],
    responses: { 200: { description: 'The category', schema: 'CategoryResponse' }, 404: NOT_FOUND },
  },
  {
    method: HttpMethod.POST, path: '/categories', operationId: 'createCategory', summary: 'Creates a category', tag: 'Categories',
    requestBody: 'CategoryInput',
    responses: { 201: { description: 'Category created', schema: 'CategoryResponse' }, 400: VALIDATION_ERROR, 422: UNPROCESSABLE },
  },
  {
    method: HttpMethod.PUT, path: '/categories/{name}', operationId: 'updateCategory', summary: 'Changes a category', tag: 'Categories',
    parameters: [CATEGORY_NAME_PARAMETER], requestBody: 'CategoryInput',
    responses: {
      200: { description: 'Category changed', schema: 'CategoryResponse' }, 400: VALIDATION_ERROR, 404: NOT_FOUND, 422: UNPROCESSABLE,
    },
  },
  {
    method: HttpMethod.DELETE, path: '/categories/{name}', operationId: 'deleteCategory', summary: 'Deletes a category', tag: 'Categories',
    parameters: [CATEGORY_NAME_PARAMETER],
    responses: { 204: DELETED },
  },
  {
    method: HttpMethod.GET, path: '/items', operationId: 'getItems', summary: 'Lists every item', tag: 'Items',
    responses: { 200: { description: 'Items', schema: 'ItemResponse', isList: true } },
  },
  {
    method: HttpMethod.GET, path: '/items/category/{category}', operationId: 'getItemsByCategory', summary: 'Lists the items of a category',
    tag: 'Items',
    parameters: [{
      name: 'category', location: ParameterLocation.PATH, type: ParameterType.STRING, description: 'Name of the category', isRequired: true,
    }],
    responses: { 200: { description: 'Items', schema: 'ItemResponse', isList: true } },
  },
  {
    method: HttpMethod.GET, path: '/items/similar', operationId: 'getSimilarItems',
    summary: 'Lists the items whose name is likely a duplicate of a name, most similar first', tag: 'Items',
    parameters: [
      SIMILAR_NAME_PARAMETER,
      {
        name: 'categoryId', location: ParameterLocation.QUERY, type: ParameterType.INTEGER,
        description: 'Only compare against items of this category', isRequired: false,
      },
    ],
    responses: { 200: { description: 'Similar items', schema: 'ItemResponse', isList: true }, 400: VALIDATION_ERROR },
  },
  {
    method: HttpMethod.GET, path: '/items/{id}', operationId: 'getItem', summary: 'Gets an item', tag: 'Items',
    parameters: [ID_PARAMETER],
    responses: { 200: { description: 'The item', schema: 'ItemResponse' }, 404: NOT_FOUND },
  },
  {
    method: HttpMethod.POST, path: '/items', operationId: 'createItem', summary: 'Creates an item', tag: 'Items',
    requestBody: 'ItemInput',
    responses: { 201: { description: 'Item created', schema: 'ItemResponse' }, 400: VALIDATION_ERROR, 422: UNPROCESSABLE },
  },
  {
    method: HttpMethod.PUT, path: '/items/{id}', operationId: 'updateItem', summary: 'Changes an item', tag: 'Items',
    parameters: [ID_PARAMETER], requestBody: 'ItemInput',
    responses: { 200: { description: 'Item changed', schema: 'ItemResponse' }, 404: NOT_FOUND, 422: UNPROCESSABLE },
  },
  {
    method: HttpMethod.DELETE, path: '/items/{id}', operationId: 'deleteItem', summary: 'Deletes an item', tag: 'Items',
    parameters: [ID_PARAMETER],
    responses: { 204: DELETED },
  },
  {
    method: HttpMethod.GET, path: '/ratings', operationId: 'getRatings', summary: 'Lists every rating', tag: 'Ratings',
    responses: { 200: { description: 'Ratings', schema: 'RatedItemResponse', isList: true } },
  },
  {
    method: HttpMethod.GET, path: '/ratings/user/{user_id}', operationId: 'getRatingsByUser', summary: 'Lists the ratings of a user',
    tag: 'Ratings',
    parameters: [{
      name: 'user_id', location: ParameterLocation.PATH, type: ParameterType.INTEGER, description: 'Id of the user', isRequired: true,
    }],
    responses: { 200: { description: 'Ratings', schema: 'RatedItemResponse', isList: true } },
  },
  {
    method: HttpMethod.GET, path: '/ratings/item/{item_id}', operationId: 'getRatingsByItem', summary: 'Lists every rating of an item',
    tag: 'Ratings', parameters: [ITEM_ID_PARAMETER],
    responses: { 200: { description: 'Ratings', schema: 'RatedItemResponse', isList: true } },
  },
  {
    method: HttpMethod.GET, path: '/ratings/mine', operationId: 'getMyRatings', summary: 'Lists the signed-in user\'s ratings',
    tag: 'Ratings',
    responses: { 200: { description: 'Ratings', schema: 'RatedItemResponse', isList: true } },
  },
  {
    method: HttpMethod.GET, path: '/ratings/{id}', operationId: 'getRating', summary: 'Gets a rating', tag: 'Ratings',
    parameters: [ID_PARAMETER],
    responses: { 200: { description: 'The rating', schema: 'RatedItemResponse' }, 404: NOT_FOUND },
  },
  {
    method: HttpMethod.POST, path: '/ratings', operationId: 'createRating', summary: 'Rates an item as the signed-in user', tag: 'Ratings',
    requestBody: 'NewRatingInput',
    responses: { 201: { description: 'Rating created', schema: 'RatedItemResponse' }, 400: VALIDATION_ERROR },
  },
  {
    method: HttpMethod.PUT, path: '/ratings/{id}', operationId: 'updateRating', summary: 'Changes a rating', tag: 'Ratings',
    parameters: [ID_PARAMETER], requestBody: 'RatingInput',
    responses: { 200: { description: 'Rating changed', schema: 'RatedItemResponse' }, 404: NOT_FOUND },
  },
  {
    method: HttpMethod.DELETE, path: '/ratings/{id}', operationId: 'deleteRating', summary: 'Deletes a rating', tag: 'Ratings',
    parameters: [ID_PARAMETER],
    responses: { 204: DELETED },
  },
  {
    method: HttpMethod.GET, path: '/comments/item/{item_id}', operationId: 'getCommentsByItem',
    summary: 'Lists the discussion of an item, oldest first', tag: 'Comments', parameters: [ITEM_ID_PARAMETER],
    responses: { 200: { description: 'Comments', schema: 'CommentResponse', isList: true } },
  },
  {
    method: HttpMethod.POST, path: '/comments/item/{item_id}', operationId: 'createComment',
    summary: 'Posts a comment to an item as the signed-in user', tag: 'Comments', parameters: [ITEM_ID_PARAMETER],
    requestBody: 'CommentInput',
    responses: {
      201: { description: 'Comment posted', schema: 'CommentResponse' },
      400: { description: 'The body is missing or too long', schema: 'APIError' },
      404: NOT_FOUND,
    },
  },
  {
    method: HttpMethod.DELETE, path: '/comments/{id}', operationId: 'deleteComment',
    summary: 'Deletes a comment written by the signed-in user, or any comment for admins and moderators', tag: 'Comments',
    parameters: [ID_PARAMETER],
    responses: { 204: DELETED, 403: { description: 'The comment belongs to someone else', schema: 'APIError' } },
  },
  {
    method: HttpMethod.GET, path: '/imports/{source}', operationId: 'findImportItems',
    summary: 'Lists the items found on an external service, without saving them', tag: 'Imports',
    parameters: [
      {
        name: 'source', location: ParameterLocation.PATH, type: ParameterType.STRING, description: 'External service to search',
        isRequired: true, schema: 'ImportSource',
      },
      {
        name: 'query', location: ParameterLocation.QUERY, type: ParameterType.STRING, isRequired: true,
        description: 'A Last.fm username, or a YouTube video or playlist URL',
      },
    ],
    responses: {
      200: { description: 'Items found', schema: 'ImportedItem', isList: true },
      400: { description: 'The source is unknown or the query is missing', schema: 'APIError' },
      404: { description: 'The Last.fm user or YouTube video or playlist does not exist', schema: 'APIError' },
      502: { description: 'The external service failed', schema: 'APIError' },
      503: { description: 'The source has no API key configured', schema: 'APIError' },
    },
  },
]
