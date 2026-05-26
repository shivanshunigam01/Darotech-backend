import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

const cache = globalThis;

export async function connectDB() {
  if (!env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is required');
  }

  if (cache._mongoose?.conn) {
    return cache._mongoose.conn;
  }

  if (!cache._mongoose) {
    cache._mongoose = { conn: null, promise: null };
  }

  if (!cache._mongoose.promise) {
    mongoose.set('strictQuery', true);
    cache._mongoose.promise = mongoose.connect(env.MONGO_URI).then((conn) => {
      logger.info(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    });
  }

  cache._mongoose.conn = await cache._mongoose.promise;
  return cache._mongoose.conn;
}
