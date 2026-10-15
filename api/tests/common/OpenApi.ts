import { Router, RequestHandler } from 'express'
import { RouteConfig } from '@/models/RouteConfig'
import { API_BASE_PATH, ApiOperation, HttpMethod, ParameterLocation, ParameterType } from '@/models/OpenApi'

/** A public operation that takes a body, and a protected one with a path parameter and a list response. */
export const TEST_OPERATIONS: ApiOperation[] = [
  {
    method: HttpMethod.POST, path: '/login', operationId: 'login', summary: 'Signs in', tag: 'Login', isPublic: true,
    requestBody: 'LoginInput', responses: { 200: { description: 'Signed in', schema: 'UserTokenResponse' } },
  },
  {
    method: HttpMethod.GET, path: '/ratings/item/{item_id}', operationId: 'getRatingsByItem', summary: 'Lists ratings', tag: 'Ratings',
    parameters: [{
      name: 'item_id', location: ParameterLocation.PATH, type: ParameterType.INTEGER, description: 'Id of the item', isRequired: true,
    }],
    responses: { 200: { description: 'Ratings', schema: 'RatedItemResponse', isList: true } },
  },
]

/** Whether a route's handler is an Express router, whose stack lists the routes it serves. */
const isRouter = (handler: RequestHandler): handler is Router => 'stack' in handler

/** Lists every operation the API routers serve as "method path", with path parameters in OpenAPI form such as `{id}`. */
export const servedOperations = (routes: RouteConfig[]): string[] => routes.flatMap((routeConfig) => {
  const handler = routeConfig.controller()
  if (!isRouter(handler)) {
    return []
  }

  return handler.stack.flatMap((layer) => (layer.route?.stack ?? []).map((routeLayer) => {
    const subPath = layer.route?.path === '/' ? '' : layer.route?.path
    return `${routeLayer.method} ${routeConfig.path}${subPath}`.replace(/:(\w+)/g, '{$1}')
  }))
})

/** Lists the documented operations as "method path", with the API base path. */
export const documentedOperations = (operations: ApiOperation[]): string[] => (
  operations.map((operation) => `${operation.method} ${API_BASE_PATH}${operation.path}`)
)
