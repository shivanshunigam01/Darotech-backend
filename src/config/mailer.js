import nodemailer from 'nodemailer'; import { env } from './env.js';
export const mailer = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_SECURE, auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined });
export async function verifyMailer(){ if(!env.SMTP_HOST || !env.SMTP_USER) return false; return mailer.verify(); }
