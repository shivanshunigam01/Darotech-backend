import mongoose from 'mongoose'; import { env } from './env.js'; import { logger } from './logger.js';
export async function connectDB(){ mongoose.set('strictQuery', true); const conn=await mongoose.connect(env.MONGO_URI); logger.info(`MongoDB connected: ${conn.connection.host}`); return conn; }
