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

@Entity()
class MyEntity {
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
        entities: [MyEntity],
        synchronize: true, // This will automatically create tables
        ssl: {
          rejectUnauthorized: false,
        },
      })
      await connection.initialize()
    } else {
      connection = connectionManager.get('default')
    }

    const repository = connection.getRepository(MyEntity)

    // Insert initial data
    await repository.save([
      { column1: 'value1', column2: 1 },
      { column1: 'value2', column2: 2 },
      { column1: 'value3', column2: 3 },
      { column1: 'value4', column2: 4 },
      { column1: 'value5', column2: 5 },
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
    const repository = connection.getRepository(MyEntity)
    const data = await repository.find()
    res.status(200).send(JSON.stringify(data))
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
