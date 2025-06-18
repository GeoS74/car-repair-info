const mongoose = require('mongoose');
const connection = require('../libs/connection');
// const Action = require('./Action');

const Schema = new mongoose.Schema({
  title: {
    type: String,
    unique: 'Не уникальное значение {PATH}',
  },
  // actions: {
  //   type: [mongoose.Schema.Types.ObjectId],
  //   ref: Action,
  // }
}, {
  timestamps: true,
});

Schema.index(
  {
    title: 'text',
  },
  {
    name: 'TaskSearchIndex',
    default_language: 'russian',
  },
);

module.exports = connection.model('Task', Schema);
