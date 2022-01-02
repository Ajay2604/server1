const jwt = require("jsonwebtoken");
const User = require("../model/userSchema");
const MasterUser = require("../model/masterUserSchema");

const AuthenticateMaster = async (req, res, next) => {
    try {
        const token = req.cookies.jwtoken; 
        // console.log("token==>",token);
        const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
        // console.log("verifyToken:", verifyToken);// verify token with secret key
        const rootUser = await User.findOne({ _id: verifyToken._id, "tokens.token": token });

        const masterUser = await MasterUser.findOne({ email: rootUser.email });
        // console.log("rootUser @ line 12==>:", rootUser);// user data

        if (!masterUser) {
            console.log("security breach tried from ==>",verifyToken.email);
            throw new Error('User Does not have permission');

        } else {

            const dataUser = {
                email: rootUser.email,
                
            }
            req.token = token;
            req.rootUser = dataUser;
            console.log("req.rootUser==>", req.rootUser);
            
        }

        next();

    } catch (error) {
        res.status(401).send("Unauthorised");
        console.log(error);
    }
};

module.exports = AuthenticateMaster;