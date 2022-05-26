const mongoose=require("mongoose")
const plm=require('passport-local-mongoose')
mongoose.connect('mongodb://localhost/twitter')

const userSchema=mongoose.Schema({
  name:String,
  username:String,
  contact:Number,
  email:String,
  password:String,
  tweets:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'tweets'
  }],
  followers:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'users'
  }],
  following:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'users'
  }]
})
userSchema.plugin(plm)

module.exports=mongoose.model("users",userSchema)
