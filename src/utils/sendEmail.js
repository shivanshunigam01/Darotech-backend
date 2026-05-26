import { mailer } from '../config/mailer.js'; import { env } from '../config/env.js';
export async function sendEmail({to, subject, html, text}){ if(!env.SMTP_HOST || !env.SMTP_USER) return {skipped:true, reason:'SMTP not configured'}; return mailer.sendMail({from: env.MAIL_FROM, to, subject, html, text}); }
