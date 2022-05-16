const mongoose=require("mongoose")
tweetSchema=mongoose.Schema({
    imgurl:String,
    caption:String,
username:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"users"
},
    likes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    }],
    createdat:{
        type:Date,
        default:Date.now()
    },
    shares:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    }]
})


module.exports=mongoose.model('tweets',tweetSchema)