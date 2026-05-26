import { logger } from '../config/logger.js';
export const errorHandler=(err,req,res,next)=>{ const status=err.statusCode||500; logger.error(`${req.method} ${req.originalUrl} ${status} - ${err.message}`, {stack:err.stack, details:err.details}); res.status(status).json({success:false,message:err.message||'Server Error',details:err.details||undefined}); };
