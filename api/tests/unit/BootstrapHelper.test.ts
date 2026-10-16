import { describe, it, expect } from 'vitest'
import { isBootstrapEnabled, readBootstrapAdmin } from '@/helpers/BootstrapHelper'

describe('isBootstrapEnabled', () => {
  it('is enabled when SEED_BOOTSTRAP_DATA is true', () => {
    // GIVEN SEED_BOOTSTRAP_DATA set to true
    // WHEN the flag is read
    // THEN seeding is enabled
    expect(isBootstrapEnabled({ SEED_BOOTSTRAP_DATA: 'true' })).toBe(true)
  })

  it.each([undefined, 'false', '1'])('is disabled when SEED_BOOTSTRAP_DATA is %s', (value) => {
    // GIVEN SEED_BOOTSTRAP_DATA unset or set to anything but true
    // WHEN the flag is read
    // THEN seeding is disabled
    expect(isBootstrapEnabled({ SEED_BOOTSTRAP_DATA: value })).toBe(false)
  })
})

describe('readBootstrapAdmin', () => {
  it('reads the admin login from the BOOTSTRAP_ADMIN_* variables', () => {
    // GIVEN every bootstrap admin variable
    const env = { BOOTSTRAP_ADMIN_USERNAME: 'admin', BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com', BOOTSTRAP_ADMIN_PASSWORD: 'secret' }

    // WHEN the admin is read
    // THEN it carries those values
    expect(readBootstrapAdmin(env)).toEqual({ username: 'admin', email: 'admin@example.com', password: 'secret' })
  })

  it('names every missing variable', () => {
    // GIVEN only the username
    const env = { BOOTSTRAP_ADMIN_USERNAME: 'admin' }

    // WHEN the admin is read
    // THEN it fails naming the email and password variables
    expect(() => readBootstrapAdmin(env))
      .toThrow('SEED_BOOTSTRAP_DATA is true but BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD is not set')
  })
})
