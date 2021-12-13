const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Authenticate = require("../middleware/authenticate");
const rateLimiterUsingThirdParty = require("../middleware/ratelimiter");
const cookieParser = require("cookie-parser");
const { OAuth2Client } = require('google-auth-library');

const sendMail = require('./mailAPI');


router.use(cookieParser()); // if jwtoken error
const client = new OAuth2Client('981651724564-lhl0q94397rk4s46i2311ot6h6k6j5bm.apps.googleusercontent.com')

const signOutTime = 3600000; // mili seconds
const api_key = "009d5a6bc1b05504b17266a5b69dbac8-7005f37e-b715f431";
// const DOMAIN = "https://api.mailgun.net/v3/sandboxf2ede09dedb54b718c47361363314eca.mailgun.org"
// const mg = mailgun({ apiKey: api_key, domain: DOMAIN });
require('../db/conn');
const User = require("../model/userSchema");


router.use(rateLimiterUsingThirdParty);
router.post('/register', async (req, res) => {
  // console.log(req.body);
  let { username, email, password, cpassword } = req.body;
  email = email.toLowerCase();

  try {
    if ((!username || !email || !password || !cpassword) && (password != cpassword)) {
      return res.status(422).json({ error: "Plz fill all columns" });
    } else {

      let signUpToken = jwt.sign({ username, email, password }, process.env.SECRET_KEY, { expiresIn: '20m' });

      const userExist = await User.findOne({ email: email }); //mern#09
      if (userExist) {
        console.log("Already registered");
        return res.status(422).json({ error: "Already registered" });
      } else {

        sendMail(username, email, signUpToken)
          .then((result) => console.log('Email sent...', result))
          .catch((error) => console.log(error.message));
      res.status(201).json({ message: 'please activate your email' });


        // if (password == cpassword) { // save in mongo db
        //   const user = new User({ username, email, password,cpassword});
        //   await user.save();
        //   res.status(201).json({ message: 'User Created successfully' });
        // } else {
        //   return res.status(422).json({ error: "Password do not match" });
        // }
      }
    }
  } catch (err) {
    console.log(err);
    res.status(422).json({ message: 'data not valid' });

  }

});

router.post('/AuthMail', async (req, res) => {
  try {
    const { signUpToken } = req.body;
    console.log(req.body);
    const verifyToken = jwt.verify(signUpToken, process.env.SECRET_KEY);
    console.log(verifyToken);
    const { username, email, password } = verifyToken;
    const cpassword = password;
    const userExist = await User.findOne({ email: email }); //mern#09
    if (userExist) {
      console.log("Already registered");
      return res.status(422).json({ error: "Already registered" });
    } else { // save in mongo db
      const user = new User({ username, email, password, cpassword });
      await user.save();
      res.status(201).json({ message: 'User Created successfully' });
    }

  } catch (err) {
    console.log("err at signup token verification", err);
    res.status(400).json({ error: 'error during signup please try again later' });

  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // console.log(req.body);

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter credentials' });
  }
  try {
    const userLogin = await User.findOne({ email: `${email.toLowerCase()}` });

    if (userLogin) {
      const isMatch = await bcrypt.compare(password, userLogin.password);

      if (isMatch) {
        const token = await userLogin.generateAuthToken();
        // console.log(token);
        
        res.cookie("jwtoken", token, {
          expires: new Date(Date.now() + 3600000),
          httpOnly: true
        });

        return res.status(200).json(token);
      } else {
        res.status(401).json({ error: 'invalid credetials ' });
      }
    } else {
      return res.status(401).json({ error: 'invalid credetials' });
    }

  } catch (error) {
    console.log(error);
  }
});

router.post('/googleAuth', async (req, res) => {
  let { tokenId } = req.body; // this is google token
  try {
    // verify token from google with googleAPI and give jwt token back to user
    const goggleTokenVerified = await client.verifyIdToken({ idToken: tokenId, audience: "981651724564-lhl0q94397rk4s46i2311ot6h6k6j5bm.apps.googleusercontent.com" })

    const { email, email_verified, name, picture } = goggleTokenVerified.payload;
    if (email_verified) {
      console.log("Google id verified");
      const userExist = await User.findOne({ email: email }); //mern#09
      let { imgUrl } = userExist;
      if (imgUrl != picture) {
        // code to change imgUrl
        userExist.imgUrl = picture;
        await userExist.save();
      }
      if (userExist) { // login id needed to be sent
        const token = await userExist.generateAuthToken();//user token will be generated from userID and Secret key
        console.log(`${email} logged in by google- confirmed server side`);
        res.cookie("jwtoken", token, {
          expires: new Date(Date.now() + signOutTime),
          httpOnly: true
        });
        res.status(200).json({ message: ` ${email} logged in by google -confirmed client side` });

      } else {// need to register

        password = email + "Tx3T0uSvfkGkmN@09urt!";
        cpassword = password;
        let username = name.replace(" ", "_");
        console.log(username);
        imgUrl = picture;
        const user = new User({ username, email, imgUrl, password, cpassword });
        await user.save();
        const userExist2 = await User.findOne({ email: email });
        const token = await userExist2.generateAuthToken();//user token will be generated from userID and Secret key
        console.log(`${userExist2.email} sign up and logged in by google- confirmed server side `);
        res.cookie("jwtoken", token, {
          expires: new Date(Date.now() + signOutTime),
          httpOnly: true
        });
        res.status(200).json({ message: ` ${userExist2.email}sign up and logged in by google- confirmed client side ` });

      }
    }

  } catch (err) {
    console.log(err);
  }
});

router.post('/forgot-password', async(req,res)=>{
  try {
    const {email} = req.body;
    const userExist = await User.findOne({ email: email });
    if(!userExist){
      res.status(404).json({message:"user does not exist"});
    }else{
      const forgotPassSecret = process.env.SECRET_KEY + userExist.password;
      const { username, email, password } = userExist
      let passResetToken = jwt.sign({ username, email, password }, forgotPassSecret, { expiresIn: '20m' });
      
      passResetMail(username, email, passResetToken)
          .then((result) => console.log('Email sent...', result))
          .catch((error) => console.log(error.message));
      res.status(201).json({ message: 'please activate your email' });

    }
    
  } catch (error) {
    console.log(error)
  }
})
router.post('/reset-password', async(req,res)=>{})

router.get('/about', Authenticate, (req, res) => {
  res.send(req.rootUser);
});

router.get('/logout', (req, res) => {
  res.clearCookie('jwtoken', { path: "/" });
  res.status(200).send('Logout success');

})

module.exports = router;
  // router.post('/register',(req, res)=>{
  //   // console.log(req.body);
  //   // res.json({message:req.body})
  //   const {name, username, email, password, cpassword} = req.body;
  //   // res.json({message:req.body.name}); // can not use two response

  //   if (!name || !username || !email || !password || !cpassword){
  //     return res.status(422).json({error : "Plz fill all columns"})
  //   }
  //   User.findOne({email:email})
  //   .then((userExist)=>{
  //     if(userExist){
  //       return res.status(422).json({error : "Already registered"})
  //     }

  //       const user = new User({name, username, email, password, cpassword});

  //       user.save().then(()=>{
  //         res.status(201).json({message:'User Created successfully'});
  //       }).catch((err)=>{res.status(500).json({error:"Failed to register Try again later"})});

  //   }).catch((err)=> {console.log(err);});
  // })