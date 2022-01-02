const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const commentSchema = new mongoose.Schema(
    {
        bookId: {
            type: Number,
            required: true
        },
        book_Title: {
            type: String,
            required: true
        },
        comments: [
            {
                userId: {
                    type: String,
                    required: true
                },
                comment: {
                    type: String,
                    required: true
                },
                commentTime: {
                    type: Date,
                    required: true
                }
            }
        ]
    }
);



const comment = mongoose.model('COMMENT',commentSchema);

module.exports = comment;
