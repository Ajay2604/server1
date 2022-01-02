const express = require('express');
const router = express.Router(); // use express as router
const bcrypt = require('bcrypt'); // to bcrypt the password
const jwt = require('jsonwebtoken');  // to generate jwt token
const Authenticate = require("../middleware/authenticate"); // middleware to authenticate before sending data
const AuthenticateMaster = require("../middleware/authenticateMaster"); // middleware to authenticate before sending data
const rateLimiterUsingThirdParty = require("../middleware/ratelimiter"); // rate limiter
const APILimit = require("../middleware/ratelimiter"); // rate limiter
const APILimitForAccountCreation = require("../middleware/ratelimiter"); // rate limiter
const cookieParser = require("cookie-parser"); // cokkie parser, if not used then error in JWtoken verification
const { OAuth2Client } = require('google-auth-library');  // google OAuth2Client 
const registerMail = require('../MailAPIs/registerMailAPI'); // to send register mail
const passResetMail = require('../MailAPIs/passResetMailAPI'); // Password reset mail
const TelegramBot = require('node-telegram-bot-api'); // Telegram Bot
const fs = require('fs'); // File System- to edit and modify
require('../db/conn'); // data base connection
const User = require("../model/userSchema"); // user schema addition


router.use(cookieParser()); // if jwtoken error
const client = new OAuth2Client(process.env.CLIENT_ID)

const signOutTime = 3600000; // mili seconds

router.use(rateLimiterUsingThirdParty);
router.use('/forgot-password', APILimit);
router.use('/register', APILimitForAccountCreation);

//Telegram bot for sending data
const sender_bot_token = '5017264133:AAGM8jahot-3zAUbP84jXOHl-AVD8cklJ0Q';
const bot = new TelegramBot(sender_bot_token, { polling: true });

router.get('/telegramBotCheck', async () => {
  try {
    console.log('bot code working');
    // bot.sendMessage(-1001718616330, 'someone visited ');
    let chatId = '-1001718616330'
    const fileOptions = {
      // Explicitly specify the file name.
      filename: 'customfilename.json',
      // Explicitly specify the MIME type.
      contentType: 'application/json',
    };
    bot.sendDocument(chatId, "./localdata/index.json", {}, fileOptions);

  } catch (error) {
    console.log(error);
  }
})

router.post('/register', async (req, res) => {
  try {
    // console.log(req.body);
    let { username, email, password, cpassword } = req.body;
    email = email.toLowerCase();
    if ((!username || !email || !password || !cpassword) && (password != cpassword)) {
      return res.status(422).json({ error: "Plz fill all columns" });
    } else {

      let signUpToken = jwt.sign({ username, email, password }, process.env.SECRET_KEY, { expiresIn: '20m' });

      const userExist = await User.findOne({ email: email }); //mern#09
      if (userExist) {
        console.log("Already registered");
        return res.status(422).json({ error: "Already registered" });
      } else {

        registerMail(username, email, signUpToken)
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
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter credentials' });
    }
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
  try {
    let { tokenId } = req.body; // this is google token
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

router.post('/forgot-password', async (req, res) => {
  try {
    console.log(req.body)
    const { email } = req.body;
    const userExist = await User.findOne({ email: email });
    console.log("userexist=", userExist);
    if (!userExist) {
      res.status(404).json({ message: "user does not exist" });
    } else {
      const forgotPassSecret = process.env.SECRET_KEY + userExist.password;
      const { username, email, password } = userExist
      let passResetToken = jwt.sign({ username, email, password }, forgotPassSecret, { expiresIn: '20m' });

      passResetMail(username, email, passResetToken)
        .then((result) => console.log('Email sent...', result))
        .catch((error) => console.log(error.message));
      res.status(200).json({ message: 'please activate your email' });

    }

  } catch (error) {
    console.log(error)
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    console.log("resetpassrequest=", req.body)
    const { email, password, resetToken } = req.body;
    const userExist = await User.findOne({ email: email });
    const resetPassSecret = process.env.SECRET_KEY + userExist.password;
    const verifyToken = jwt.verify(resetToken, resetPassSecret);
    console.log(verifyToken.email, "210")
    if (verifyToken.email == email) {
      userExist.password = password;
      await userExist.save();
      console.log("$", email, "password reset")
      res.status(200).json({ message: "Password Reset successful" })
    }
  } catch (err) {
    res.status(400).json({ error: "Invalid or Exipred link" })

  }
});

router.get('/about', Authenticate, async (req, res) => {
  res.send(req.rootUser);
});

router.post('/registerChapter', AuthenticateMaster, async (req, res) => {
  console.log("req.body==>", req.body)
  try {
    const { bookName, chapterName, chapterIndex, chapterBody } = req.body;

    // {need to make file from above data}

    // telegram bot data sent
    let chatId = process.env.telegram_chatId;
    let fileName = `${bookName}_${chapterIndex}_${chapterName}.json`;
    let filePath = `./localdata/${fileName}`;
    console.log("260");
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2), err => {
      if (err) {
        console.log("error in wrinting file==>", err);
      }
    });
    console.log("266");
    const fileOptions = {

      filename: fileName,       // Explicitly specify the file name.

      contentType: 'application/json'    // Explicitly specify the MIME type.
    };
    bot.sendMessage(-1001718616330, 'some documents i am sharing');

    fs.stat(filePath, function (err, stats) {
      // console.log(stats);//here we got all information of file in stats variable
      if (err) {
        return console.error(err);
      }

      bot.sendDocument(chatId, filePath, {}, fileOptions); // here we send the file through telegram bot
      console.log("282");
      setTimeout(() => {
        // fs.unlinkSync(filePath);
        fs.unlink(filePath, function (err) {
          if (err) return console.log(err);
          console.log('file deleted successfully');
        });

      }, 5000);
    });

    console.log("293");

    res.status(200).json({ message: "chapter added successful" })
  } catch (error) {
    console.log("chapter entry error ==>", error)
  }
});

router.get('/logout', async (req, res) => {
  try {
    res.clearCookie('jwtoken', { path: "/" });
    res.status(200).send('Logout success');

  } catch (error) {
    res.status(400).send('There is some issue in logout');
  }

});

module.exports = router;