import 'reflect-metadata'

import { DataSource } from 'typeorm'
import express from 'express'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import RatedItem from '@/models/RatedItem'
import Item from '@/models/Item'
import User from '@/models/User'
import Attribute from '@/models/Attribute'
import AttributeValue from '@/models/AttributeValue'
import Category from '@/models/Category'
import ChangeRequest from '@/models/ChangeRequest'
import Comment from '@/models/Comment'
import { RegisterRoutes } from '@/routes/generated/routes'
import { addDefaultHeaders, errorHandler, notFoundHandler } from '@/helpers/RequestHandlers'
import { enableSimilarityExtensions } from '@/helpers/SimilarityHelper'
import path from 'path'
import http from 'http'
import { logger } from '@/helpers/Logger'

/** Window the request rate limit counts over, in milliseconds (15 minutes). */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

/** Requests one client may make per rate limit window. */
const RATE_LIMIT_MAX_REQUESTS = 100

/** Postgres port used when neither PGPORT nor DATABASE_PORT is set. */
const DEFAULT_DATABASE_PORT = 5432

/** How long to wait for a database connection, in milliseconds. */
const DATABASE_CONNECT_TIMEOUT_MS = 10000

/** Most database connections the pool keeps open. */
const DATABASE_POOL_SIZE = 10

/** HTTP port used when PORT is not set. */
const DEFAULT_PORT = 3000

if (process.env.NODE_ENV === 'test') {
  dotenv.config({
    path: path.resolve(__dirname, '../.env.test'),
    override: true
  })
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') })
}

const app = express()
let server: http.Server
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
})

app.use(limiter)
app.use(cors())
app.use(bodyParser.json())
app.use(addDefaultHeaders)

const DBConnection: DataSource = new DataSource({
  name: 'default',
  type: 'postgres',
  host: process.env.PGHOST || process.env.DATABASE_HOST,
  port: Number(process.env.PGPORT || process.env.DATABASE_PORT || DEFAULT_DATABASE_PORT),
  username: process.env.PGUSER || process.env.DATABASE_USERNAME,
  password: process.env.PGPASSWORD || process.env.DATABASE_PASSWORD,
  database: process.env.PGDATABASE || process.env.DATABASE_NAME,
  entities: [RatedItem, Item, User, Attribute, AttributeValue, Category, ChangeRequest, Comment],
  synchronize: true,
  connectTimeoutMS: DATABASE_CONNECT_TIMEOUT_MS,
  extra: {
    max: DATABASE_POOL_SIZE,
    connectionTimeoutMillis: DATABASE_CONNECT_TIMEOUT_MS,
  }
})

/** Connects to the database, enables the similarity extensions and mounts every route. */
const initializeApp = async (): Promise<typeof app> => {
  try {
    await DBConnection.initialize()
    await enableSimilarityExtensions(DBConnection)
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
