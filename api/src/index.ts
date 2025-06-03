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
import { routes, authenticationFilter } from '@/routes/RouterAuthConfig'

const app = express()

// set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
})

// apply rate limiter to all requests
app.use(cors())
app.use(bodyParser.json())

 
export const DBConnection: DataSource = new DataSource({
  name: 'default',
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [RatedItem, Item, User, Attribute, AttributeValue, Category],
  synchronize: true, // This will automatically create tables
  ssl: {
    rejectUnauthorized: false,
  },
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
