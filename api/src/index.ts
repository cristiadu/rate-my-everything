import 'reflect-metadata'

import { DataSource } from 'typeorm'
import express from 'express'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import bodyParser from 'body-parser'

import RatedItem from '@/models/RatedItem'
import Item from '@/models/Item'
import User from '@/models/User'
import Attribute from '@/models/Attribute'
import AttributeValue from '@/models/AttributeValue'
import Category from '@/models/Category'
import { routes, authenticationFilter, addDefaultHeaders } from '@/routes/RouterAuthConfig'

// Export the app so it can be used in tests
const app = express()

// set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
})

// apply rate limiter to all requests
app.use(cors())
app.use(bodyParser.json())
app.use(addDefaultHeaders)

 
const DBConnection: DataSource = new DataSource({
  name: 'default',
  type: 'postgres',
  host: process.env.PGHOST || process.env.DATABASE_HOST,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : (process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 5432),
  username: process.env.PGUSER || process.env.DATABASE_USERNAME,
  password: process.env.PGPASSWORD || process.env.DATABASE_PASSWORD,
  database: process.env.PGDATABASE || process.env.DATABASE_NAME,
  entities: [RatedItem, Item, User, Attribute, AttributeValue, Category],
  synchronize: true, // This will automatically create tables
})

DBConnection.initialize()
  .then(() => {
    console.log('Data Source has been initialized!')

    app.use(limiter)
    
    // Apply authentication filter to all routes except unprotected ones
    app.use((req, res, next) => {
      authenticationFilter(req, res, next)
    })

    // Use the routes
    routes.forEach((route) => app.use(route.path, route.controller()))

    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err)
  })

export { app, DBConnection }