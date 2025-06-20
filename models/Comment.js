const mongoose = require('mongoose');
const connection = require('../libs/connection');
const User = require('./User');

const Schema = new mongoose.Schema({
  comment: String,

  files: [{ originalName: String, fileName: String }],

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    required: 'не заполнено обязательное поле {PATH}',
  },

  doc: {
    type: mongoose.Schema.Types.ObjectId,
  },
}, {
  timestamps: true,
});

module.exports = connection.model('Comment', Schema);
