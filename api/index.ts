import * as functions from 'firebase-functions';
import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';

// Initialize Firebase
var serviceAccount = require('./temp/rate-my-everything-firebase-adminsdk-5nc7w-7e2308c0ed.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

// Initialize Express
const app = express();

app.use(cors());
app.use(bodyParser.json());

// API endpoint
app.get('/data', async (req: Request, res: Response) => {
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

// Export the API as a function
exports.api = functions.https.onRequest(app);
