const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cpassword: {
        type: String,
        required: true
    }
});

//Hash the password
userSchema.pre('save', async function (next){
console.log('Hashing works');
if(this.isModified('password')){

    this.password = await bcrypt.hash(this.password,12);
    this.cpassword = await bcrypt.hash(this.cpassword,12);
}
next();
});

const User = mongoose.model('USER',userSchema);

module.exports = User;

/* {
	"name":"Ajay",
	"username":"ninkin",
	"email":"ajay@gmail.com",
	"password":"123456",
	"cpassword":"123456"
} */