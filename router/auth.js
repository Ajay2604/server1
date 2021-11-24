const express = require('express');
const router = express.Router();

/* router.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, '../public/index.html'), function (err) {
        console.log(path);
      if (err) {
        res.status(500).send(err);
        console.log("Something wrong");
      }
    })
  }) */

require('../db/conn');
const User = require("../model/userSchema");

router.get('/register', (req, res) => {
  res.send('Hello - please register here')
})

router.post('/register', async (req, res) => {

  let { name, username, email, password, cpassword } = req.body;

      if (!name || !username || !email || !password || !cpassword) {
        return res.status(422).json({ error: "Plz fill all columns" });
      }
      try {
        email = email.toLowerCase();
        const userExist = await User.findOne({ email: email }); //mern#09

        if (userExist) {
          return res.status(422).json({ error: "Already registered" })
        };
        const user = new User({ name, username, email, password, cpassword });

        await user.save();

        res.status(201).json({ message: 'User Created successfully' });

  } catch (err) {
    console.log(err);
  }

})
module.exports = router;
router.post('/login', async (req,res)=>{
  const {email, password} = req.body;
  // console.log(req.body);
  if(!email || !password){
    return res.status(400).json({error: 'Please enter credentials'})
  }
  try {
    const userLogin = await User.findOne({email: `${email.toLowerCase()}`});
    // if(userLogin){
    //   console.log(userLogin.password);
    // };
    if(!userLogin){
      return res.status(401).json({error: 'invalid credetials'});
    };
    if(userLogin.password !== password){
      return res.status(401).json({error: 'invalid credetials'});
    };
    res.status(200).json({Message: 'You are Authorised'});
  } catch (error) {
    console.log(error);
  }
});

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