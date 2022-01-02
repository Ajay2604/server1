const express = require('express');
const path = require('path');
const app = express();
const port = 5000;
app.listen(process.env.PORT || port, () => { console.log(`Listnening at ${port}`) });
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({path:'./config.env'});

// import { rateLimiterUsingThirdParty } from './middlewares';
// app.use(rateLimiterUsingThirdParty);
require('./db/conn');// connection 

app.use(express.json());

const User = require('./model/userSchema');

// //middleware 
// const middleware = (req, res, next) =>{next();};

 app.use(express.static('public'));

app.use(require('./router/auth')); 

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/index.html'), function (err) {
    if (err) {
      res.status(500).send(err);
      console.log("Something wrong");
    }
  })
})

// my pull