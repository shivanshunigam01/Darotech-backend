import multer from 'multer'; import path from 'path'; import fs from 'fs'; import { env } from '../config/env.js'; import { ApiError } from '../utils/ApiError.js';
fs.mkdirSync(env.UPLOAD_DIR,{recursive:true});
const allowed=['image/jpeg','image/png','image/webp','image/gif','video/mp4','application/pdf'];
const storage=multer.diskStorage({ destination: env.UPLOAD_DIR, filename: (req,file,cb)=>cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`)});
export const upload=multer({ storage, limits:{fileSize: env.MAX_UPLOAD_MB*1024*1024}, fileFilter:(req,file,cb)=> allowed.includes(file.mimetype)?cb(null,true):cb(new ApiError(400,'Unsupported file type')) });
