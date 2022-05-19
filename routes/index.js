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
  userModel.findOne({username:req.session.passport.user})
  .then(function(user){
    tweetModel.find()
    .populate("username")
    .then(function(allposts){
      res.render("profile",{user,allposts})
    })
  })


})
router.post('/createtweet', isLoggedIn, upload.single("imgurl"), function (req,res) {
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





router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/'
}), function (req, res, next) { })

router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/')
});
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();

  } else {
    res.redirect('/');
  }

}

module.exports = router;
