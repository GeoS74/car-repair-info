const mongoose = require('mongoose');
const connection = require('../libs/connection');

const Schema = new mongoose.Schema({
  title: {
    type: String,
    unique: 'Не уникальное значение {PATH}',
    required: 'не заполнено обязательное поле {PATH}',
  },
}, {
  timestamps: true,
});

Schema.index(
  {
    title: 'text',
  },
  {
    name: 'DirectingSearchIndex',
    default_language: 'russian',
  },
);

module.exports = connection.model('Company', Schema);
