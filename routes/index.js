var express = require('express');
var router = express.Router();
var userModel = require('./users')
var tweetModel = require("./tweets")
var passport = require('passport');
const localstrategy = require('passport-local');
const multer = require('multer');
const res = require('express/lib/response');
passport.use(new localstrategy(userModel.authenticate()));
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/Uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage })

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});
router.post('/register', function (req, res) {
  var data = new userModel({
    name: req.body.name,
    username: req.body.name,
    email: req.body.email,
    contact: req.body.contact
  })
  userModel.register(data, req.body.password)
    .then(function (u) {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/profile')
      })
    })
    .catch(function (e) {
      res.send(e);
    })
});
router.get('/profile', isLoggedIn, function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (user) {
      tweetModel.find()
        .populate("username")
        .then(function (allposts) {

          allposts.reverse()
          res.render("profile", { user, allposts })
        })
    })


})
router.post('/createtweet', isLoggedIn, upload.single("imgurl"), function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (loggedinuser) {
      if (req.file === undefined) {
        tweetModel.create({
          caption: req.body.caption,
          username: loggedinuser._id
        }).then(function (tweet) {
          loggedinuser.tweets.push(tweet)
          loggedinuser.save()
            .then(function (data) {
              res.redirect('/profile')
            })
        })
      }
      else {
        tweetModel.create({
          imgurl: req.file.filename,
          caption: req.body.caption,
          username: loggedinuser._id
        }).then(function (tweet) {
          loggedinuser.tweets.push(tweet)
          loggedinuser.save()
            .then(function (data) {
              res.redirect('/profile')
            })
        })
      }

    })
})
router.get("/like/:postid", function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (user) {
      tweetModel.findOne({ _id: req.params.postid })
        .then(function (post) {
          if (post.likes.indexOf(user._id) === -1) {
            post.likes.push(user._id)
            post.save()
              .then(function (data) {
                res.redirect('/profile')
              })
          }
          else {
            var index = post.likes.indexOf(user._id)
            post.likes.splice(index, 1)
            post.save()
              .then(function (data) {
                res.redirect('/profile')
              })
          }



        })
    })



})

router.get("/follow/:userid", function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (loggedinuser) {
      userModel.findOne({ _id: req.params.userid })
        .then(function (usertofollow) {
          if (usertofollow.followers.indexOf(loggedinuser._id) === -1) {
            usertofollow.followers.push(loggedinuser._id)
            usertofollow.save()
              .then(function () {
                loggedinuser.following.push(usertofollow._id)
                loggedinuser.save()
                  .then(function () {
                    res.redirect("/alluser")
                  })
              })

          }
          else {
            var index = usertofollow.followers.indexOf(loggedinuser._id)
            console.log(index);
            usertofollow.followers.splice(index, 1)
            usertofollow.save()
              .then(function () {
                var i = loggedinuser.following.indexOf(usertofollow._id)
                console.log(i);
                loggedinuser.following.splice(i, 1)
                loggedinuser.save()
                  .then(function () {
                    res.redirect("/alluser")
                  })
              })
          }
        })
    })
})
router.get('/alluser',function(req,res){
userModel.findOne({username:req.session.passport.user })
.then(function(user){
  userModel.find()
  .then(function(data){
const index=data.indexOf(user)
data.splice(index,1)
   res.render("alluser",{data,user})
  })
})



  
})
router.get("/aboutme",function(req,res){
  userModel.findOne({ username: req.session.passport.user })
  .populate("tweets")
    .then(function (user) {
res.render("aboutme",{user})
    })
})
router.post("/uploadprofile",upload.single("profilepic"),function (req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(user){

    if(req.file=== undefined){
      res.send("please upload a file")
    }
    else{
      console.log(req.file.filename);
      user.profilepic=req.file.filename
      user.save()
      .then(function(data){
        res.redirect("/aboutme")
      })
  
    }
      })
})

router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/'
}), function (req, res, next) { })

router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/')
});
router.get("/followback/:id",function(req,res){
userModel.findOne({username:req.session.passport.user})
.then(function(loggedinuser){
  userModel.findOne({_id:req.params.id})
  .then(function(user){
if (user.followers.indexOf(loggedinuser._id)===-1) {
  user.followers.push(loggedinuser._id)
user.save()
.then(function(){
  loggedinuser.following.push(user._id)
  loggedinuser.save()
  .then(function(){
    res.send("following done")
  })
})

} else {
  const index=user.followers.indexOf(loggedinuser._id)
  user.followers.splice(index,1)
  user.save()
  .then(function(){
    const i=loggedinuser.following.indexOf(user._id)
    loggedinuser.following.splice(i,1)
    loggedinuser.save()
    .then(function(){
      res.send("unfollowed")
    })
  })

}
    
    
  })
})

})

router.get("/delete/:id", function(req,res){
tweetModel.findOneAndDelete({_id:req.params.id})
.then(function(tweet){

res.redirect("/aboutme")

})


})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();

  } else {
    res.redirect('/');
  }

}

module.exports = router;
