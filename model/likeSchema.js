const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const likeSchema = new mongoose.Schema(
    {
        bookId: {
            type: Number,
            required: true
        },
        book_Title: {
            type: String,
            required: true
        },
        users: [
            {
                type: String,
                required: true
            }
        ]
    }
);



const like = mongoose.model('LIKE',likeSchema);

module.exports = like;
