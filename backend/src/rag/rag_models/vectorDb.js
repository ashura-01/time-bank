import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let client;
let db;
let collection;

export const connectVectorDB = async () => {
  if (!client) {
    client = new MongoClient(process.env.RAG_MONGODB_URI);
    await client.connect();
    db = client.db(process.env.RAG_DB_NAME);
    collection = db.collection(process.env.RAG_COLLECTION_NAME);
    console.log('MongoDB Vector DB connected successfully');
  }
  return { db, collection };
};

export const getVectorCollection = () => {
  if (!collection) {
    throw new Error('Vector DB not initialized. Call connectVectorDB first.');
  }
  return collection;
};
