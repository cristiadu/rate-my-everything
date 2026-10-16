import type { BootstrapAdmin } from '@/models/BootstrapData'

/** Whether the API seeds the bootstrap data on start: only when SEED_BOOTSTRAP_DATA is "true". */
export const isBootstrapEnabled = (env: NodeJS.ProcessEnv): boolean => env.SEED_BOOTSTRAP_DATA === 'true'

/** Reads the bootstrap admin from the environment; throws naming every BOOTSTRAP_ADMIN_* variable that is not set. */
export const readBootstrapAdmin = (env: NodeJS.ProcessEnv): BootstrapAdmin => {
  const { BOOTSTRAP_ADMIN_USERNAME: username, BOOTSTRAP_ADMIN_EMAIL: email, BOOTSTRAP_ADMIN_PASSWORD: password } = env
  if (!username || !email || !password) {
    const missing = ['BOOTSTRAP_ADMIN_USERNAME', 'BOOTSTRAP_ADMIN_EMAIL', 'BOOTSTRAP_ADMIN_PASSWORD'].filter((variable) => !env[variable])
    throw new Error(`SEED_BOOTSTRAP_DATA is true but ${missing.join(', ')} is not set`)
  }
  return { username, email, password }
}
