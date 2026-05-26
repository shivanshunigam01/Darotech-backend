import cron from 'node-cron'; import { logger } from '../config/logger.js'; cron.schedule('0 10 * * *',()=>logger.info('Lead follow-up job placeholder executed'));
