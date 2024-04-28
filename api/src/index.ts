import 'reflect-metadata'

import { DataSource } from 'typeorm'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import RatedItem from './models/RatedItem'
import Item from './models/Item'
import User from './models/User'
import Attribute from './models/Attribute'
import AttributeValue from './models/AttributeValue'
import Category from './models/Category'
import { routes, authenticationFilter } from './routes/RouterAuthConfig'

const app = express()
app.use(cors())
app.use(bodyParser.json())

// eslint-disable-next-line import/prefer-default-export
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
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err)
  })

app.use(authenticationFilter)

// Use the routes
routes.forEach((route) => app.use(route.path, route.controller))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
