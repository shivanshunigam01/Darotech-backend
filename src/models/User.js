import { Schema, model } from 'mongoose'; import bcrypt from 'bcryptjs';
const schema=new Schema({name:{type:String,required:true},email:{type:String,required:true,unique:true,lowercase:true,index:true},password:{type:String,required:true,select:false},role:{type:String,enum:['admin','editor','sales','viewer'],default:'admin'},avatar:String,isActive:{type:Boolean,default:true}},{timestamps:true});
schema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
}); schema.methods.compare=function(p){return bcrypt.compare(p,this.password)}; export default model('User',schema);
