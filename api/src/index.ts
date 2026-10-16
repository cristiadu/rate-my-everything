import 'reflect-metadata'

import express from 'express'
import { DBConnection } from '@/Database'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import bodyParser from 'body-parser'
import { RegisterRoutes } from '@/routes/generated/routes'
import { addDefaultHeaders, errorHandler, notFoundHandler } from '@/helpers/RequestHandlers'
import { TOO_MANY_REQUESTS_EXAMPLE } from '@/api/ApiDocumentation'
import { enableSimilarityExtensions } from '@/helpers/SimilarityHelper'
import http from 'http'
import { logger } from '@/helpers/Logger'
import { isBootstrapEnabled, readBootstrapAdmin } from '@/helpers/BootstrapHelper'
import BootstrapService from '@/services/BootstrapService'

/** Window the request rate limit counts over, in milliseconds (15 minutes). */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

/** Requests one client may make per rate limit window. */
const RATE_LIMIT_MAX_REQUESTS = 100

/** HTTP port used when PORT is not set. */
const DEFAULT_PORT = 3000

const app = express()
let server: http.Server
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: TOO_MANY_REQUESTS_EXAMPLE,
})

app.use(limiter)
app.use(cors())
app.use(bodyParser.json())
app.use(addDefaultHeaders)

/** Connects to the database, enables the similarity extensions, seeds the bootstrap data when enabled and mounts every route. */
const initializeApp = async (): Promise<typeof app> => {
  try {
    await DBConnection.initialize()
    await enableSimilarityExtensions(DBConnection)
    if (isBootstrapEnabled(process.env)) {
      await new BootstrapService().seed(readBootstrapAdmin(process.env))
    }
  } catch (err) {
    logger.error(err, 'Error during Data Source initialization')
    throw err
  }
  logger.info('Data Source has been initialized')
  const apiRouter = express.Router()
  RegisterRoutes(apiRouter)
  app.use('/api', apiRouter, notFoundHandler)
  app.use(errorHandler)
  return app
}

/** Starts listening for HTTP requests once the app is ready. */
const startServer = async (): Promise<void> => {
  const appInstance = await appReady
  const port = process.env.PORT || DEFAULT_PORT
  server = appInstance.listen(port, () => {
    logger.info(`Server is running on port ${port}`)
  })
}

const appReady = initializeApp()
startServer()

export { appReady, DBConnection, server }
