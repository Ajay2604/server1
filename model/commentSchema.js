const mongoose = require('mongoose');

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
        rating: {
            type: Number,
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



const Comment = mongoose.model('COMMENT',commentSchema);

module.exports = Comment;
