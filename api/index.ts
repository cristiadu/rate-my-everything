import express, { Request, Response } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import admin from 'firebase-admin'

// Initialize Firebase
const serviceAccount = require('./temp/rate-my-everything-firebase-adminsdk-5nc7w-7e2308c0ed.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

// Initialize Express
const app = express()

app.use(cors())
app.use(bodyParser.json())

// API endpoint
app.get('/api/data', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('your-collection-name').get()
    const data: any[] = []
    snapshot.forEach((doc) => {
      const { id } = doc
      const appData = doc.data()
      data.push({ id, ...appData })
    })
    res.status(200).send(JSON.stringify(data))
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
})

// Start server
app.listen(8000, () => {
  console.log('Server is running on port 3000')
})
