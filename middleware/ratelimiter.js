// import rateLimit from 'express-rate-limit';
const rateLimit = require("express-rate-limit")

const rateLimiterUsingThirdParty = rateLimit({
  windowMs: 60 * 1000, // 24 hrs in milliseconds
  max: 60,
  message: 'You have exceeded request limit for your IP. please wait few seconds!', 
  headers: true,
});

module.exports = rateLimiterUsingThirdParty;