import jwt from 'jsonwebtoken'

import RatedItemController from '../api/RatedItemController'
import UserController from '../api/UserController'
import AttributeController from '../api/AttributeController'
import ItemController from '../api/ItemController'
import CategoryController from '../api/CategoryController'
import UserRole from '../models/UserRole'
import LoginController from '../api/LoginController'

export const unprotectedRoutes = new Set([
  '/api/login',
  '/api/login/register',
  // Add more unprotected routes as needed
])

export const routes = [
  { path: '/api/ratings', controller: () => new RatedItemController().router, roles: [UserRole.USER, UserRole.ADMIN] },
  { path: '/api/users', controller: () => new UserController().router, roles: [UserRole.ADMIN] },
  { path: '/api/login', controller: () => new LoginController().router, roles: [] },
  { path: '/api/attributes', controller: () => new AttributeController().router, roles: [UserRole.ADMIN] },
  { path: '/api/items', controller: () => new ItemController().router, roles: [UserRole.USER, UserRole.ADMIN] },
  { path: '/api/categories', controller: () => new CategoryController().router, roles: [UserRole.USER, UserRole.ADMIN] },
  // Add more routes as needed
]

export function authenticationFilter(req: any, res: any, next: any) {
  // Check if the route is unprotected
  if (unprotectedRoutes.has(req.path)) {
    return next()
  }

  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]
  if (authHeader == null || !authHeader.startsWith('Bearer ') || token == null) {
    return res.sendStatus(401) // if the auth header is missing or not in the correct format
  }

  jwt.verify(token, 'your-secret-key', (err: any, user: any) => {
    if (err) {
      return res.sendStatus(401)
    }

    // Find the route that matches the request
    const route = routes.find((currentRoute) => req.path.startsWith(currentRoute.path))

    // Check if the user has one of the required roles
    if (!route || !route.roles.some((role) => user.roles.includes(role))) {
      return res.sendStatus(403) // Forbidden
    }

    req.user = user
    return next() // pass the execution off to whatever request the client intended
  })

  return res.sendStatus(500) // invalid status
}
