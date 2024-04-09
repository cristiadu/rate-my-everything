import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';

// Initialize Firebase
var serviceAccount = require('./path/to/your/firebase/key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

// Initialize Express
const app = express();

app.use(cors());
app.use(bodyParser.json());

// API endpoint
app.get('/api/data', async (req: Request, res: Response) => {
  try {
    let snapshot = await db.collection('your-collection-name').get();
    let data: any[] = [];
    snapshot.forEach(doc => {
      let id = doc.id;
      let appData = doc.data();
      data.push({ id, ...appData });
    });
    res.status(200).send(JSON.stringify(data));
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});