import dotenv from 'dotenv';
dotenv.config();
const required = ['MONGO_URI','JWT_ACCESS_SECRET','JWT_REFRESH_SECRET'];
for (const key of required) if (!process.env[key]) console.warn(`[env] Missing ${key}`);
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development', PORT: Number(process.env.PORT || 5000), API_PREFIX: process.env.API_PREFIX || '/api/v1',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*', MONGO_URI: process.env.MONGO_URI,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-access', JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh', JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  SMTP_HOST: process.env.SMTP_HOST, SMTP_PORT: Number(process.env.SMTP_PORT || 587), SMTP_SECURE: process.env.SMTP_SECURE === 'true', SMTP_USER: process.env.SMTP_USER, SMTP_PASS: process.env.SMTP_PASS, MAIL_FROM: process.env.MAIL_FROM || process.env.SMTP_USER, ADMIN_NOTIFY_EMAIL: process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads', MAX_UPLOAD_MB: Number(process.env.MAX_UPLOAD_MB || 10),
};
