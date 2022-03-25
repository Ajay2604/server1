const express = require("express");
const router = express.Router(); // use express as router
const bcrypt = require("bcrypt"); // to bcrypt the password
const jwt = require("jsonwebtoken"); // to generate jwt token
const Authenticate = require("../middleware/authenticate"); // middleware to authenticate before sending data
const AuthenticateMaster = require("../middleware/authenticateMaster"); // middleware to authenticate before sending data
const rateLimiterUsingThirdParty = require("../middleware/ratelimiter"); // rate limiter
const APILimit = require("../middleware/ratelimiter"); // rate limiter
const APILimitForAccountCreation = require("../middleware/ratelimiter"); // rate limiter
const cookieParser = require("cookie-parser"); // cokkie parser, if not used then error in JWtoken verification
const { OAuth2Client } = require("google-auth-library"); // google OAuth2Client
const registerMail = require("../MailAPIs/registerMailAPI"); // to send register mail
const passResetMail = require("../MailAPIs/passResetMailAPI"); // Password reset mail
// const TelegramBot = require("node-telegram-bot-api"); // Telegram Bot
const fs = require("fs"); // File System- to edit and modify
const User = require("../model/userSchema"); // user schema addition
const BookInfo = require("../model/bookInfoSchema"); // BookInfo schema addition
const Like = require("../model/likeSchema"); // likes schema addition
const Comment = require("../model/commentSchema"); // user schema addition
require("../db/conn"); // data base connection

router.use(cookieParser()); // if jwtoken error
const client = new OAuth2Client(process.env.CLIENT_ID);

const signOutTime = 3600000; // mili seconds

// router.use(rateLimiterUsingThirdParty);
// router.use('/forgot-password', APILimit);
// router.use('/register', APILimitForAccountCreation);

//Telegram bot for sending data to telegram group
// const sender_bot_token = process.env.sender_bot_token; // electron
// const bot = new TelegramBot(sender_bot_token, { polling: true });

//...............................................................get functions ////.......................................
// router.get('/telegramBotCheck', async () => {
//   try {
//     let chatId = process.env.telegram_chatId;
//     console.log('bot code working');
//     bot.sendMessage(chatId, 'bot working ');
//     const fileOptions = {
//       // Explicitly specify the file name.
//       filename: 'customfilename.json',
//       // Explicitly specify the MIME type.
//       contentType: 'application/json',
//     };
//     // bot.sendDocument(chatId, "./localdata/index.json", {}, fileOptions);

//   } catch (error) {
//     console.log(error);
//   }
// })
router.get("/getBook",async(req,res)=>{
  try {
    if(!req.query.book){
      res.status(404).send({ data: "error no book found" });
      return;
    }
      console.log("reuest at getchapter",req.query)
      console.log("req for book info");
      let book_Title = req.query.book.trim().toLowerCase().replace(" ", "-");
      const bookExist = await BookInfo.findOne({ book_Title: book_Title }); //mern#09
      if (bookExist) {
        const {
          bookId,
          book_Title,
          bookCover_URL,
          volume_Index,
          volume_Title,
          author,
          genre,
          total_Chapter,
          last_Updated_Chapter,
          book_Description,
          likes_Numbers,
          comments_Numbers,
          rating_Average,
        } = bookExist;
  
        // {bookinfo block} //...
        //make book info json
        let bookInfo1 = {
          bookId,
          book_Title,
          bookCover_URL,
          volume_Index,
          volume_Title,
          author,
          genre,
          total_Chapter,
          last_Updated_Chapter,
          book_Description,
          likes_Numbers,
          comments_Numbers,
          rating_Average,
        };
        res.status(200).send(bookInfo1);
        // ...//
      } else {
        res.status(404).send({ data: "error no book found" });
      }
    } catch (error) {
      console.log(error);
      res.status(400).send({ data: "page not found" });
    }
  });


router.get("/getChapter", async (req, res) => {
  try {
      if(!req.query.book || !req.query.chapter){
        res.status(404).send({ data: "error no book found" });
        return;
      }
    let book_Title = req.query.book.trim().toLowerCase().replace(/\s/g, "-");

    const bookExist = await BookInfo.findOne({ book_Title: book_Title }); //mern#09
    // console.log("bookExist==>", bookExist.chapters)
    // {chapter block} //...
    let chapterIndex = req.query.chapter;
    chapterIndex = parseFloat(chapterIndex.replace("chapter-", ""));
    if (!chapterIndex) {
      res.status(404).send({ data: "chapter found" });
    }

    let chapter = 1;
    const chFindFunc = (text) => {
      if (text.chapter_Index == chapterIndex) {
        return true;
      }
    };

    const chapterExist = await bookExist.chapters.find(chFindFunc);
    let spliceIndex = await bookExist.chapters.indexOf(chapterExist);
    // console.log(bookExist.chapters[spliceIndex - 1].chapter_Index);
    let arr = bookExist.chapters
    let previousChapter, nextChapter
    if(spliceIndex === 1 || spliceIndex === 0 ){
      previousChapter = false
      nextChapter =  arr[spliceIndex + 1].chapter_Index

    }else if (spliceIndex >= arr.length - 1){
      nextChapter = false
      previousChapter =  arr[spliceIndex - 1].chapter_Index

    }else{
      nextChapter =  arr[spliceIndex + 1].chapter_Index
      previousChapter =  arr[spliceIndex - 1].chapter_Index
      
    }
    // console.log(typeof(arr[spliceIndex - 1]));
    // console.log(JSON.parse(bookExist.chapters[spliceIndex - 1]));
    // console.log(typeof(JSON.parse(bookExist.chapters[spliceIndex - 1])));
    
    let data = {
      previousChapter: previousChapter,
      nextChapter: nextChapter,
      body: chapterExist.url,
    };
    res.status(200).send(data);

    // ...//
  } catch (error) {
    console.log("error at sending chapter", error);
  }
});

// post functions
router.post("/register", async (req, res) => {
  try {
    // console.log(req.body);
    let { username, email, password, cpassword } = req.body;
    email = email.toLowerCase();
    if (
      (!username || !email || !password || !cpassword) &&
      password != cpassword
    ) {
      return res.status(422).json({ error: "Plz fill all columns" });
    } else {
      let signUpToken = jwt.sign(
        { username, email, password },
        process.env.SECRET_KEY,
        { expiresIn: "20m" }
      );

      const userExist = await User.findOne({ email: email }); //mern#09
      if (userExist) {
        console.log("Already registered");
        return res.status(422).json({ error: "Already registered" });
      } else {
        registerMail(username, email, signUpToken)
          .then((result) => console.log("Email sent...", result))
          .catch((error) => console.log(error.message));
        res.status(201).json({ message: "please activate your email" });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(422).json({ message: "data not valid" });
  }
});

router.post("/AuthMail", async (req, res) => {
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
    } else {
      // save in mongo db
      const user = new User({ username, email, password, cpassword });
      await user.save();
      res.status(201).json({ message: "User Created successfully" });
    }
  } catch (err) {
    console.log("err at signup token verification", err);
    res
      .status(400)
      .json({ error: "error during signup please try again later" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please enter credentials" });
    }
    const userLogin = await User.findOne({ email: `${email.toLowerCase()}` });

    if (userLogin) {
      const isMatch = await bcrypt.compare(password, userLogin.password);

      if (isMatch) {
        const token = await userLogin.generateAuthToken();
        // console.log(token);

        res.cookie("jwtoken", token, {
          expires: new Date(Date.now() + 36000000),
          httpOnly: true,
        }); // 10 hours expiry

        return res.status(200).json(token);
      } else {
        res.status(401).json({ error: "invalid credetials " });
      }
    } else {
      return res.status(401).json({ error: "invalid credetials" });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/googleAuth", async (req, res) => {
  try {
    let { tokenId } = req.body; // this is google token
    // verify token from google with googleAPI and give jwt token back to user
    const goggleTokenVerified = await client.verifyIdToken({
      idToken: tokenId,
      audience:
        "981651724564-lhl0q94397rk4s46i2311ot6h6k6j5bm.apps.googleusercontent.com",
    });

    const { email, email_verified, name, picture } =
      goggleTokenVerified.payload;
    if (email_verified) {
      console.log("Google id verified");
      const userExist = await User.findOne({ email: email }); //mern#09
      let { imgUrl } = userExist;
      if (imgUrl != picture) {
        // code to change imgUrl
        userExist.imgUrl = picture;
        await userExist.save();
      }
      if (userExist) {
        // login id needed to be sent
        const token = await userExist.generateAuthToken(); //user token will be generated from userID and Secret key
        console.log(`${email} logged in by google- confirmed server side`);
        res.cookie("jwtoken", token, {
          expires: new Date(Date.now() + signOutTime),
          httpOnly: true,
        });
        res.status(200).json({
          message: ` ${email} logged in by google -confirmed client side`,
        });
      } else {
        // need to register

        password = email + "Tx3T0uSvfkGkmN@09urt!";
        cpassword = password;
        let username = name.replace(" ", "_");
        console.log(username);
        imgUrl = picture;
        const user = new User({ username, email, imgUrl, password, cpassword });
        await user.save();
        const userExist2 = await User.findOne({ email: email });
        const token = await userExist2.generateAuthToken(); //user token will be generated from userID and Secret key
        console.log(
          `${userExist2.email} sign up and logged in by google- confirmed server side `
        );
        res.cookie("jwtoken", token, {
          expires: new Date(Date.now() + signOutTime),
          httpOnly: true,
        });
        res.status(200).json({
          message: ` ${userExist2.email}sign up and logged in by google- confirmed client side `,
        });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    console.log(req.body);
    const { email } = req.body;
    const userExist = await User.findOne({ email: email });
    console.log("userexist=", userExist);
    if (!userExist) {
      res.status(404).json({ message: "user does not exist" });
    } else {
      const forgotPassSecret = process.env.SECRET_KEY + userExist.password;
      const { username, email, password } = userExist;
      let passResetToken = jwt.sign(
        { username, email, password },
        forgotPassSecret,
        { expiresIn: "20m" }
      );

      passResetMail(username, email, passResetToken)
        .then((result) => console.log("Email sent...", result))
        .catch((error) => console.log(error.message));
      res.status(200).json({ message: "please activate your email" });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    console.log("resetpassrequest==>", req.body);
    const { email, password, resetToken } = req.body;
    const userExist = await User.findOne({ email: email });
    const resetPassSecret = process.env.SECRET_KEY + userExist.password;
    const verifyToken = jwt.verify(resetToken, resetPassSecret);
    console.log(verifyToken.email, "210");
    if (verifyToken.email == email) {
      userExist.password = password;
      await userExist.save();
      console.log("$", email, "password reset");
      res.status(200).json({ message: "Password Reset successful" });
    }
  } catch (err) {
    res.status(400).json({ error: "Invalid or Exipred link" });
  }
});

router.get("/about", Authenticate, async (req, res) => {
  res.send(req.rootUser);
});

router.post("/registerChapter", AuthenticateMaster, async (req, res) => {
  console.log("req.body==>", req.body);
  try {
    const { bookName, chapterName, chapterIndex } = req.body;

    // {need to make file from above data}

    // telegram bot data sent
    let chatId = process.env.telegram_chatId;
    let fileName = `${bookName}_${chapterIndex}_${chapterName}.json`;
    let filePath = `./localdata/${fileName}`;

    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2), (err) => {
      if (err) {
        console.log("error in wrinting file==>", err);
      }
    });

    const fileOptions = {
      filename: fileName, // Explicitly specify the file name.
      contentType: "application/json", // Explicitly specify the MIME type.
    };

    // bot.sendMessage(chatId, 'some documents i am sharing');

    fs.stat(filePath, function (err, stats) {
      // console.log(stats);//here we got all information of file in stats variable
      if (err) {
        return console.error(err);
      }

      // bot.sendDocument(chatId, filePath, {}, fileOptions); // here we send the file through telegram bot
      setTimeout(() => {
        // fs.unlinkSync(filePath);
        fs.unlink(filePath, function (err) {
          if (err) return console.log(err);
          console.log("file deleted successfully");
        });
      }, 5000);
    });

    res.status(200).json({ message: "chapter added successful" });
  } catch (error) {
    console.log("chapter entry error ==>", error);
  }
});

router.post("/registerBook", Authenticate, async (req, res) => {
  // console.log("req.body==>", req.body)
  try {
    let {
      bookId,
      book_Title,
      bookCover_URL,
      volume_Index,
      volume_Title,
      author,
      genre,
      total_Chapter,
      last_Updated_Chapter,
      book_Description,
      likes_Numbers,
      comments_Numbers,
      rating_Average,
    } = req.body;
    const chapters = [];
    book_Title = book_Title.trim().toLowerCase().replace(" ", "-");

    // const genre = [];
    const authorEmail = req.rootUser.email;
    const bookExist = await BookInfo.findOne({ book_Title: book_Title }); //mern#09
    if (bookExist) {
      if (
        bookExist.authorEmail === req.rootUser.email ||
        req.rootUser.email === process.env.masterEmail1 ||
        req.rootUser.email === process.env.masterEmail2
      ) {
        //update the book

        bookExist.book_Title = bookTitleTemp;
        bookExist.genre = genre;
        bookExist.bookCover_URL = bookCover_URL;
        bookExist.volume_Index = volume_Index;
        bookExist.volume_Title = volume_Title;
        bookExist.author = author;
        bookExist.total_Chapter;
        bookExist.book_Description = book_Description;
        await bookExist.save();
        return res.status(201).json({ Message: "book updated" });
      } else {
        return res.status(401).json({ Message: "Invalid request" });
      }
    } else {
      const book = new BookInfo({
        bookId,
        book_Title,
        bookCover_URL,
        genre,
        volume_Index,
        volume_Title,
        author,
        authorEmail,
        total_Chapter,
        last_Updated_Chapter,
        book_Description,
        likes_Numbers,
        comments_Numbers,
        rating_Average,
        chapters,
      });
      await book.save();
      res.status(200).json({ message: "Book registered" });
    }
  } catch (error) {
    console.log("book entry error ==>", error);
    return res.status(401).json({ Message: "Invalid request" });
  }
});

router.post("/bookInfo", Authenticate, async (req, res) => {
  try {
    // console.log(req.body)
    let { book_Title } = req.body;
    book_Title = book_Title.trim().toLowerCase().replace(" ", "-");

    const bookExist = await BookInfo.findOne({ book_Title: book_Title }); //mern#09

    // console.log("book==>", bookExist)

    if (bookExist) {
      if (
        bookExist.authorEmail === req.rootUser.email ||
        req.rootUser.email === process.env.masterEmail1 ||
        req.rootUser.email === process.env.masterEmail2
      ) {
        // res.status(200).json(JSON.stringify(bookExist));
        const {
          bookId,
          book_Title,
          bookCover_URL,
          volume_Index,
          volume_Title,
          author,
          genre,
          total_Chapter,
          last_Updated_Chapter,
          book_Description,
          likes_Numbers,
          comments_Numbers,
          rating_Average,
        } = bookExist;

        const bookDetails = {
          bookId,
          book_Title,
          bookCover_URL,
          volume_Index,
          volume_Title,
          author,
          genre,
          total_Chapter,
          last_Updated_Chapter,
          book_Description,
          likes_Numbers,
          comments_Numbers,
          rating_Average,
        };
        res.send(bookDetails);
      } else {
        res.status(401).json({ error: "invalid credetials" });
      }
    } else {
      res.status(402).json({ error: "book not found" });
      //
    }
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "invalid credetials or book not found" });
  }
});

router.get("/logout", async (req, res) => {
  try {
    res.clearCookie("jwtoken", { path: "/" });
    res.status(200).send("Logout success");
  } catch (error) {
    res.status(400).send("There is some issue in logout");
  }
});

module.exports = router;

// router.get("/getChapter/:slug", async (req, res) => {
//   try {
//     console.log("req for book info");
//     let book_Title = req.params.slug.trim().toLowerCase().replace(" ", "-");
//     const bookExist = await BookInfo.findOne({ book_Title: book_Title }); //mern#09
//     if (bookExist) {
//       const {
//         bookId,
//         book_Title,
//         bookCover_URL,
//         volume_Index,
//         volume_Title,
//         author,
//         genre,
//         total_Chapter,
//         last_Updated_Chapter,
//         book_Description,
//         likes_Numbers,
//         comments_Numbers,
//         rating_Average,
//       } = bookExist;

//       // {bookinfo block} //...
//       //make book info json
//       let bookInfo1 = {
//         bookId,
//         book_Title,
//         bookCover_URL,
//         volume_Index,
//         volume_Title,
//         author,
//         genre,
//         total_Chapter,
//         last_Updated_Chapter,
//         book_Description,
//         likes_Numbers,
//         comments_Numbers,
//         rating_Average,
//       };
//       res.status(200).send(bookInfo1);
//       // ...//
//     } else {
//       res.status(404).send({ data: "error no book found" });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(400).send({ data: "page not found" });
//   }
// });


