import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let dbReady;

async function ensureDb() {
  if (!dbReady) {
    dbReady = connectDB();
  }
  return dbReady;
}

/** Vercel serverless entry — do not use app.listen() here. */
export default async function handler(req, res) {
  await ensureDb();
  return app(req, res);
}
