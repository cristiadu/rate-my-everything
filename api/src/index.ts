import 'reflect-metadata'
import {
  Entity, PrimaryGeneratedColumn, Column, getConnectionManager,
  DataSource,
} from 'typeorm'
import express, { Request, Response } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

const app = express()
app.use(cors())
app.use(bodyParser.json())

@Entity('your_table_name')
class YourEntity {
  @PrimaryGeneratedColumn()
    id!: number

  @Column()
    column1!: string

  @Column()
    column2!: number
}

const connectionManager = getConnectionManager()
let connection: DataSource

async function bootstrapData() {
  try {
    if (!connectionManager.has('default')) {
      connection = connectionManager.create({
        name: 'default',
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [YourEntity],
        synchronize: true, // This will automatically create tables
      })
      await connection.initialize()
    } else {
      connection = connectionManager.get('default')
    }

    const repository = connection.getRepository(YourEntity)

    // Insert initial data
    await repository.save([
      { column1: 'value1', column2: 1 },
      { column1: 'value2', column2: 2 },
      { column1: 'value3', column2: 3 },
    ])

    console.log('Data bootstrapped successfully')
  } catch (error) {
    console.error('Error bootstrapping data:', error)
  }
}

bootstrapData()

// API endpoint
app.get('/api/data', async (req: Request, res: Response) => {
  try {
    const repository = connection.getRepository(YourEntity)
    const data = await repository.find()
    res.status(200).send(JSON.stringify(data))
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
})
