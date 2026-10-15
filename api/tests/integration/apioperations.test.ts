import { describe, it, expect } from 'vitest'
import '@/index'
import { routes, unprotectedRoutes } from '@/routes/RouterAuthConfig'
import { API_OPERATIONS } from '@/routes/ApiOperations'
import { API_BASE_PATH } from '@/models/OpenApi'
import { documentedOperations, servedOperations } from '@@/testutils/common/OpenApi'

describe('API operations', () => {
  it('documents every operation the API serves, and nothing else', () => {
    // GIVEN the routes the API serves
    // WHEN the served and documented operations are listed
    const served = servedOperations(routes)
    const documented = documentedOperations(API_OPERATIONS)

    // THEN both lists hold the same operations, each once
    expect([...documented].sort()).toEqual([...served].sort())
    expect(new Set(documented).size).toBe(documented.length)
  })

  it('marks as public exactly the paths that skip authentication', () => {
    // GIVEN the documented operations
    // WHEN the public ones are listed
    const publicPaths = API_OPERATIONS.filter((operation) => operation.isPublic).map((operation) => `${API_BASE_PATH}${operation.path}`)

    // THEN they are the unprotected routes
    expect(publicPaths.sort()).toEqual([...unprotectedRoutes].sort())
  })

  it('gives every operation a unique operationId', () => {
    // GIVEN the documented operations
    // WHEN their ids are collected
    const operationIds = API_OPERATIONS.map((operation) => operation.operationId)

    // THEN no id repeats
    expect(new Set(operationIds).size).toBe(operationIds.length)
  })
})
