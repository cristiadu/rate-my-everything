import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import Attribute from '@/models/Attribute'
import { CategoryResponse } from '@/models/Category'
import { UserResponse, UserTokenResponse } from '@/models/User'
import UserRole from '@/models/UserRole'
import BootstrapService from '@/services/BootstrapService'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { cleanupAllAttributes, cleanupAllCategories } from '@@/testutils/common/DataCleanup'
import { Endpoints } from '@@/testutils/common/constants'

/** The admin login the seed creates in these tests. */
const BOOTSTRAP_TEST_ADMIN = { username: 'bootstrap-admin', email: 'bootstrap-admin@example.com', password: 'Bootstrap123!' }

describe('BootstrapService', async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()

  beforeAll(async () => {
    // GIVEN no categories or attributes
    await cleanupAllCategories(app)
    await cleanupAllAttributes(app)

    // WHEN the seed runs twice, as it does on every start
    await new BootstrapService().seed(BOOTSTRAP_TEST_ADMIN)
    await new BootstrapService().seed(BOOTSTRAP_TEST_ADMIN)
  })

  afterAll(async () => {
    await cleanupAllCategories(app)
    await cleanupAllAttributes(app)
    const usersRes = await request(app).get(Endpoints.USERS_BASE_PATH).set('Authorization', `Bearer ${testAuthToken}`).expect(200)
    const admin = (usersRes.body as UserResponse[]).find((user) => user.username === BOOTSTRAP_TEST_ADMIN.username)
    await request(app).delete(`${Endpoints.USERS_BASE_PATH}/${admin?.id}`).set('Authorization', `Bearer ${testAuthToken}`).expect(204)
  })

  it('creates the starter categories once, each with its color and attributes', async () => {
    // THEN each starter category exists once with its color and attributes
    const res = await request(app).get(Endpoints.CATEGORIES_BASE_PATH).set('Authorization', `Bearer ${testAuthToken}`).expect(200)
    const categories = (res.body as CategoryResponse[]).map(({ name, color, attributes }) => ({
      name, color, attributes: attributes.map((attribute) => attribute.name).sort(),
    }))
    expect(categories).toEqual([
      { name: 'Movies', color: '#E4572E', attributes: ['Director', 'Release year', 'Runtime'] },
      { name: 'Music', color: '#8E44AD', attributes: ['Artist', 'Genre', 'Release year'] },
      { name: 'Books', color: '#3E8ED0', attributes: ['Author', 'Finished', 'Pages', 'Release year'] },
      { name: 'Games', color: '#2E8B57', attributes: ['Finished', 'Platform', 'Release year'] },
      { name: 'Restaurants', color: '#F4A259', attributes: ['City', 'Cuisine', 'Last visited', 'Price per person', 'Website'] },
    ])
  })

  it('shares attributes with the same name and value type between categories', async () => {
    // THEN Release year and Finished exist once, so there are 14 attributes in total
    const res = await request(app).get(Endpoints.ATTRIBUTES_BASE_PATH).set('Authorization', `Bearer ${testAuthToken}`).expect(200)
    expect((res.body as Attribute[]).length).toBe(14)
  })

  it('creates an admin who can sign in with the configured password', async () => {
    // THEN the admin signs in and holds the admin and user roles
    const res = await request(app)
      .post(Endpoints.LOGIN_BASE_PATH)
      .send({ username: BOOTSTRAP_TEST_ADMIN.username, password: BOOTSTRAP_TEST_ADMIN.password })
      .expect(200)
    expect((res.body as UserTokenResponse).user.roles).toEqual([UserRole.ADMIN, UserRole.USER])
  })
})
