import { asyncHandler } from '../middlewares/asyncHandler.js'; import { ok, created } from '../utils/ApiResponse.js'; import { paginate } from '../utils/pagination.js'; import { ApiError } from '../utils/ApiError.js';
export const makeCrud=(Model,{searchFields=['title','name'],publicFilter=null,populate=null}={})=>({
  create: asyncHandler(async(req,res)=>created(res, await Model.create(req.body))),
  list: asyncHandler(async(req,res)=>{ const {page,limit,q,status}=req.query; const filter={}; if(status) filter.status=status; if(q) filter.$or=searchFields.map(f=>({[f]:new RegExp(q,'i')})); if(publicFilter) Object.assign(filter,publicFilter); ok(res, await paginate(Model,{page,limit,filter,populate})); }),
  get: asyncHandler(async(req,res)=>{ const item=await Model.findById(req.params.id).populate(populate||''); if(!item) throw new ApiError(404,'Record not found'); ok(res,item); }),
  getBySlug: asyncHandler(async(req,res)=>{ const item=await Model.findOne({slug:req.params.slug}).populate(populate||''); if(!item) throw new ApiError(404,'Record not found'); ok(res,item); }),
  update: asyncHandler(async(req,res)=>{ const item=await Model.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}); if(!item) throw new ApiError(404,'Record not found'); ok(res,item,'Updated'); }),
  remove: asyncHandler(async(req,res)=>{ const item=await Model.findByIdAndDelete(req.params.id); if(!item) throw new ApiError(404,'Record not found'); ok(res,{id:req.params.id},'Deleted'); })
});
