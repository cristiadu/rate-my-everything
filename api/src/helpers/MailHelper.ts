import type { MailSettings } from '@/models/MailSettings'

/** Variables required once SMTP_HOST is set. */
const REQUIRED_MAIL_VARIABLES = ['SMTP_PORT', 'SMTP_FROM', 'APP_URL']

/**
 * Reads the mail settings from the environment: null when SMTP_HOST is not set, so the API runs without sending email;
 * otherwise throws naming every required variable that is not set.
 */
export const readMailSettings = (env: NodeJS.ProcessEnv): MailSettings | null => {
  const { SMTP_HOST: host, SMTP_PORT: port, SMTP_USER: user, SMTP_PASSWORD: password, SMTP_FROM: from, APP_URL: appUrl } = env
  if (!host) {
    return null
  }
  if (!port || !from || !appUrl) {
    const missing = REQUIRED_MAIL_VARIABLES.filter((variable) => !env[variable])
    throw new Error(`SMTP_HOST is set but ${missing.join(', ')} is not set`)
  }
  return { host, port: Number(port), user, password, from, appUrl }
}
