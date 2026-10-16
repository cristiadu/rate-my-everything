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
import path from 'path'
import { logger } from '@/helpers/Logger'
import { isBootstrapEnabled, readBootstrapAdmin } from '@/helpers/BootstrapHelper'
import BootstrapService from '@/services/BootstrapService'

/** Window the request rate limit counts over, in milliseconds (15 minutes). */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

/** Requests one client may make per rate limit window. */
const RATE_LIMIT_MAX_REQUESTS = 100

/** HTTP port used when PORT is not set. */
const DEFAULT_PORT = 3000

/** Folder of the built UI the API serves next to /api, set on deployments; unset locally, where webpack serves the UI. */
const UI_DIST_DIR = process.env.UI_DIST_DIR

const app = express()
let server: http.Server
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: TOO_MANY_REQUESTS_EXAMPLE,
})

// Static UI files load before the rate limit so a page load does not spend the API's request budget.
if (UI_DIST_DIR) {
  app.use(express.static(UI_DIST_DIR))
}
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
  if (UI_DIST_DIR) {
    // Every other path is a UI route, which the UI's router renders from index.html.
    app.get('/{*uiRoute}', (_req, res) => res.type('html').sendFile(path.resolve(UI_DIST_DIR, 'index.html')))
  }
  app.use(errorHandler)
  return app
}

/** Starts listening for HTTP requests once the app is ready. */
const startServer = async (): Promise<void> => {
  const appInstance = await appReady
  const port = Number(process.env.PORT || DEFAULT_PORT)
  // Hosts that give each app its own address, like alwaysdata, set IP; otherwise listen on every address.
  const host = process.env.IP
  server = appInstance.listen(port, host, () => {
    logger.info(`Server is running on ${host ?? 'every address'}, port ${port}`)
  })
}

const appReady = initializeApp()
startServer()

export { appReady, DBConnection, server }
