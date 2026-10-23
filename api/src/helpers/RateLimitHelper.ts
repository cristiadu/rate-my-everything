import rateLimit from 'express-rate-limit'
import { TOO_MANY_REQUESTS_EXAMPLE } from '@/api/ApiDocumentation'

/** Window the password reset request limit counts over, in milliseconds (1 hour). */
const PASSWORD_RESET_WINDOW_MS = 60 * 60 * 1000

/** Password reset emails one client may ask for per window, so the endpoint cannot be used to flood inboxes. */
export const PASSWORD_RESET_MAX_REQUESTS = 5

/** Stricter limit on top of the API-wide one for asking for password reset emails. */
export const passwordResetLimiter = rateLimit({
  windowMs: PASSWORD_RESET_WINDOW_MS,
  max: PASSWORD_RESET_MAX_REQUESTS,
  message: TOO_MANY_REQUESTS_EXAMPLE,
})
