const mongoose = require('mongoose');

const bookInfoSchema = new mongoose.Schema(
    {
        bookId: {
            type: Number,
            required: true
        },
        book_Title: {
            type: String,
            required: true
        },
        bookCover_URL: {
            type: String,
            required: true
        },
        volume_Index: {
            type: Number,
            required: false
        },// 1,
        volume_Title: {
            type: String,
            required: false
        },// "Volume 1",
        author: {
            type: String,
            required: true
        },
        authorEmail:{
            type: String,
            required: false
        },
        total_Chapter: {
            type: Number,
            required: false
        },
        last_Updated_Chapter: {
            type: Number,
            required: true
        },
        last_Update_Time: {
            type: Date,
            required: false
        },
        book_Description: {
            type: String,
            required: true
        },
        genre: [{
            type: String,
            required: false
        }],
        is_Completed: {
            type: Boolean,
            required: false
        },
        is_Translated: {
            type: Boolean,
            required: false
        },
        translated_Chapters: {
            type: Number,
            required: false
        },
        likes_Numbers: {
            type: Number,
            required: false
        },
        comments_Numbers: {
            type: Number,
            required: false
        },
        rating_Average: {
            type: Number,
            required: false
        },
        ratings: {
            "1": {
                type: Number,
                required: false
            },
            "2": {
                type: Number,
                required: false
            },
            "3": {
                type: Number,
                required: false
            },
            "4": {
                type: Number,
                required: false
            },
            "5": {
                type: Number,
                required: false
            },
        },
        chapters: [
            {
                chapter_Index: {
                    type: Number,
                    required: false
                },//1,
                chapter_Title: {
                    type: String,
                    required: false
                },// "Chapter 1 - Prologue",
                url: {
                    type: String,
                    required: false
                }// "telegrambotURL/documentIndex"
            }
        ]
    }
);


const BookInfo = mongoose.model('BOOKINFO',bookInfoSchema);

module.exports = BookInfo;
