import 'reflect-metadata'
import { DataSource, getConnection } from 'typeorm'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import RatedItem from './models/RatedItem'
import RatedItemController from './api/RatedItemController'

const app = express()
app.use(cors())
app.use(bodyParser.json())

const bootstrapData = async () => {
  try {
    const repository = getConnection().getRepository(RatedItem)
    // Insert initial data
    await repository.save([
      {
        item_id: 1,
        rating: 4.5,
        user_id: 1,
        notes: 'Great phone!',
      },
      {
        item_id: 2,
        rating: 4.7,
        user_id: 1,
        notes: 'Great book!',
      },
      {
        item_id: 3,
        rating: 4.9,
        user_id: 1,
        notes: 'Great movie!',
      },
    ])

    console.log('Data bootstrapped successfully')
  } catch (error) {
    console.error('Error bootstrapping data:', error)
  }
}

// eslint-disable-next-line import/prefer-default-export
export const DBConnection: DataSource = new DataSource({
  name: 'default',
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [RatedItem],
  synchronize: true, // This will automatically create tables
  ssl: {
    rejectUnauthorized: false,
  },
})

DBConnection.initialize()
  .then(() => {
    console.log('Data Source has been initialized!')
    bootstrapData()
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err)
  })

// API endpoint
const ratedItemController = new RatedItemController()
app.use('/api/ratings', ratedItemController.router)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
