import express, { Request, Response } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { Pool } from 'pg'

// Initialize PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

// Initialize Express
const app = express()

app.use(cors())
app.use(bodyParser.json())

// API endpoint
app.get('/api/data', async (req: Request, res: Response) => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT * FROM your_table_name')
    const data = result.rows
    client.release()
    res.status(200).send(JSON.stringify(data))
  } catch (error) {
    console.error(error) //
    res.status(500).send(error)
  }
})

// Start server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
