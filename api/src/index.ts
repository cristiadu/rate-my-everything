import 'reflect-metadata'

import { DataSource } from 'typeorm'
import express from 'express'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import bodyParser from 'body-parser'
import * as dotenv from 'dotenv'
import RatedItem from '@/models/RatedItem'
import Item from '@/models/Item'
import User from '@/models/User'
import Attribute from '@/models/Attribute'
import AttributeValue from '@/models/AttributeValue'
import Category from '@/models/Category'
import { routes, authenticationFilter, addDefaultHeaders } from '@/routes/RouterAuthConfig'
import path from 'path'
import http from 'http'

if (process.env.NODE_ENV === 'test') {
  dotenv.config({
    path: path.resolve(__dirname, '../.env.test'),
    override: true
  })
}

const app = express()
let server: http.Server
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
})

app.use(limiter)
app.use(cors())
app.use(bodyParser.json())
app.use(addDefaultHeaders)
app.use(authenticationFilter)

const DBConnection: DataSource = new DataSource({
  name: 'default',
  type: 'postgres',
  host: process.env.PGHOST || process.env.DATABASE_HOST,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : (process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 5432),
  username: process.env.PGUSER || process.env.DATABASE_USERNAME,
  password: process.env.PGPASSWORD || process.env.DATABASE_PASSWORD,
  database: process.env.PGDATABASE || process.env.DATABASE_NAME,
  entities: [RatedItem, Item, User, Attribute, AttributeValue, Category],
  synchronize: true,
  connectTimeoutMS: 10000,
  extra: {
    max: 10,
    connectionTimeoutMillis: 10000,
  }
})

const appReady: Promise<typeof app> = DBConnection.initialize()
  .then(() => {
    console.log('Data Source has been initialized!')
    routes.forEach((route) => app.use(route.path, route.controller()))
    return app
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err)
    throw err
  })

  appReady.then((appInstance) => {
    const PORT = process.env.PORT || 3000
    server = appInstance.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })

export { appReady, DBConnection, server }