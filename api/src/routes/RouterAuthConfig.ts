import jwt from 'jsonwebtoken'
import RatedItemController from '@/api/RatedItemController'
import UserController from '@/api/UserController'
import AttributeController from '@/api/AttributeController'
import ItemController from '@/api/ItemController'
import CategoryController from '@/api/CategoryController'
import UserRole from '@/models/UserRole'
import LoginController from '@/api/LoginController'
import HealthController from '@/api/HealthController'
import { NextFunction, Request, Response } from 'express'
import { SessionUser } from '@/models/User'
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
  { path: '/api/login', controller: () => new LoginController().router },
  { path: '/api/attributes', controller: () => new AttributeController().router, roles: [UserRole.ADMIN] },
  { path: '/api/items', controller: () => new ItemController().router, roles: [UserRole.USER, UserRole.ADMIN] },
  { path: '/api/categories', controller: () => new CategoryController().router, roles: [UserRole.USER, UserRole.ADMIN] },
  { path: '/api/health', controller: () => new HealthController().router },
  { path: '/api', controller: () => (_req: Request, res: Response) => {
      res.status(404).json(NewApiError('RESOURCE_NOT_FOUND', 404, 'The requested resource was not found'))
    } }
]

export const authenticationFilter = (req: Request, res: Response, next: NextFunction) => {
  // Check if the route is unprotected
  if (unprotectedRoutes.has(req.path)) {
    return next()
  }

  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null
  if (!token) {
    return res.status(401).json(NewApiError('UNAUTHORIZED', 401, 'Missing or invalid authorization header'))
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable is not defined')
    return res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'Internal server error'))
  }

  try {
    const decodedUser = jwt.verify(token, jwtSecret) as SessionUser
    if (typeof decodedUser !== 'object' || decodedUser === null || !('id' in decodedUser) || !('roles' in decodedUser)) {
      return res.status(401).json(NewApiError('UNAUTHORIZED', 401, 'Invalid user object in JWT payload'))
    }
    
    if (!Array.isArray(decodedUser.roles) || !decodedUser.roles.every(role => Object.values(UserRole).includes(role))) {
      return res.status(401).json(NewApiError('UNAUTHORIZED', 401, 'Invalid roles in user object'))
    }

    const route = routes.find((currentRoute) => req.path.startsWith(currentRoute.path))
    if (!route || (route.roles && !route.roles.some((role) => decodedUser.roles.includes(role)))) {
      return res.status(403).json(NewApiError('FORBIDDEN', 403, 'You do not have permission to access this resource'))
    }

    res.locals.user = decodedUser
    return next()
  } catch (err) {
    console.log('JWT verification error:', err)
    return res.status(401).json(NewApiError('UNAUTHORIZED', 401, 'Invalid token'))
  }
}

export const addDefaultHeaders = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json')
  return next()
}
