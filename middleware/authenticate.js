const jwt = require("jsonwebtoken");
const User = require("../model/userSchema");
const cookieParser = require("cookie-parser");



const Authenticate = async (req, res, next) => {
    try {
        const token = req.cookies.jwtoken; 
        // console.log("token:", token);//token by user 

        const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
        // console.log("verifyToken:", verifyToken);// veryfy token with secret key

        const rootUser = await User.findOne({ _id: verifyToken._id, "tokens.token": token });
        // console.log("rootUser:", rootUser);// user data

        if (!rootUser) {
            throw new Error('user not found')
        } else {
            // console.log("typeOf(rootUser)",typeof(rootUser));
            // // console.log("rootUser:", rootUser);
            // console.log("rootUser.password:", rootUser.password);
            const dataUser = {
                username: rootUser.username,
                email: rootUser.email
            }
            req.token = token;
            req.rootUser = dataUser;
            console.log("req.rootUser:", req.rootUser);
            req.userID = rootUser._id;
        }

        next();

    } catch (error) {
        res.status(401).send("Unauthorised:No token provided");
        console.log(error);
    }
};

module.exports = Authenticate;