import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken'

import RatedItemController from '@/api/RatedItemController'
import UserController from '@/api/UserController'
import AttributeController from '@/api/AttributeController'
import ItemController from '@/api/ItemController'
import CategoryController from '@/api/CategoryController'
import UserRole from '@/models/UserRole'
import LoginController from '@/api/LoginController'
import HealthController from '@/api/HealthController'
import { NextFunction, Request, Response } from 'express'
import User from '@/models/User'
import { NewApiError } from '@/models/APIError'

export const unprotectedRoutes = new Set([
  '/api/login',
  '/api/login/register',
  '/api/health',
  // Add more unprotected routes as needed
])

export const routes = [
  { path: '/api/ratings', controller: () => new RatedItemController().router, roles: [UserRole.USER, UserRole.ADMIN] },
  { path: '/api/users', controller: () => new UserController().router, roles: [UserRole.ADMIN] },
  { path: '/api/login', controller: () => new LoginController().router, roles: [] },
  { path: '/api/attributes', controller: () => new AttributeController().router, roles: [UserRole.ADMIN] },
  { path: '/api/items', controller: () => new ItemController().router, roles: [UserRole.USER, UserRole.ADMIN] },
  { path: '/api/categories', controller: () => new CategoryController().router, roles: [UserRole.USER, UserRole.ADMIN] },
  { path: '/api/health', controller: () => new HealthController().router, roles: [] },
]

export const authenticationFilter = (req: Request, res: Response, next: NextFunction) => {
  // Check if the route is unprotected
  if (unprotectedRoutes.has(req.path)) {
    return next()
  }

  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]
  if (authHeader == null || !authHeader.startsWith('Bearer ') || token == null) {
    return res.status(401).json(NewApiError('UNAUTHORIZED', 401, 'Missing or invalid authorization header'))
  }

  // Make sure JWT_SECRET is defined
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable is not defined')
    return res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'Internal server error'))
  }

  return jwt.verify(token, jwtSecret, undefined, (err: VerifyErrors | null, user: string | JwtPayload | undefined) => {
    if (err) {
      return res.status(401).json(NewApiError('UNAUTHORIZED', 401, 'Invalid token'))
    }

    // User must be JwtPayload and parsed to User type
    if (typeof user !== 'object' || !('id' in user) || !('roles' in user)) {
      return res.status(401).json(NewApiError('UNAUTHORIZED', 401, 'Invalid user object in JWT payload'))
    }

    // Ensure user is of type User
    if (!Array.isArray(user.roles) || !user.roles.every(role => Object.values(UserRole).includes(role))) {
      return res.status(401).json(NewApiError('UNAUTHORIZED', 401, 'Invalid roles in user object'))
    }

    // Find the route that matches the request
    const route = routes.find((currentRoute) => req.path.startsWith(currentRoute.path))

    // Check if the user has one of the required roles
    if (!route || !route.roles.some((role) => user.roles.includes(role))) {
      return res.status(403).json(NewApiError('FORBIDDEN', 403, 'You do not have permission to access this resource'))
    }

    // Pass the user information to the next middleware by using res.locals instead of req.user
    res.locals.user = user as User
    return next() // pass the execution off to whatever request the client intended
  })
}

export const addDefaultHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json')
  return next()
}
