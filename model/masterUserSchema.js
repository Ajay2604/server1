const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const masterUserSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true
    }
});



const masterUser = mongoose.model('MASTERUSER',masterUserSchema);

module.exports = masterUser;
