// import rateLimit from 'express-rate-limit';
const rateLimit = require("express-rate-limit")

const rateLimiterUsingThirdParty = rateLimit({
  windowMs: 60 * 1000, // 60 reads per min
  max: 60,
  message: 'You have exceeded request limit for your IP. please wait few seconds!', 
  headers: true,
});

const APILimit = rateLimit({
  windowMs: 5* 60 * 1000, // 2 in 300seconds
  max: 60,//3
  message: 'You have exceeded request limit for your IP. please wait few seconds!', 
  headers: true,
});

const APILimitForAccountCreation = rateLimit({
  windowMs: 60* 60 * 1000, // 10 in 1 hr
  max: 60, //10
  message: 'You have exceeded request limit for your IP. please wait few minutes!', 
  headers: true,
});

module.exports = rateLimiterUsingThirdParty;
module.exports = APILimit;
module.exports = APILimitForAccountCreation;