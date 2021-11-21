const mongoose = require('mongoose');

const DB = process.env.DATABASE;

const dbConnect = async () => {
    const response = await mongoose.connect(DB, {
      maxPoolSize: 50,
      wtimeoutMS: 2500,
      useNewUrlParser: true,
      // useCreateIndex: true, // old version of mongoDB
      useunifiedTopology: true,
      // useFindAndModify:false // old version of mongoDB
    })
    console.log("Connection done ")
  };
  dbConnect().catch((err) => { console.log("Connction failed to DB", err) });