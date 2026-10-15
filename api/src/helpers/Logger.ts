import pino from 'pino'

/** Log level used when LOG_LEVEL is not set. */
const DEFAULT_LOG_LEVEL = 'info'

/** The API's structured logger; LOG_LEVEL picks the lowest level written (default info). */
export const logger = pino({ level: process.env.LOG_LEVEL ?? DEFAULT_LOG_LEVEL })
