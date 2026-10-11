import { RequestHandler } from 'express'
import UserRole from '@/models/UserRole'

/** An API route: who may call it (`roles`), and optionally who may call its non-read methods (`writeRoles`). */
export type RouteConfig = {
  path: string
  controller: () => RequestHandler
  roles?: UserRole[]
  writeRoles?: UserRole[]
}
