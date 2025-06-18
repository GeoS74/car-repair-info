// модель коллекции страниц в формате markdown
//
const mongoose = require('mongoose');
const connection = require('../libs/connection');

const Schema = new mongoose.Schema({
  alias: {
    type: String,
    unique: 'Не уникальное значение {PATH}',
  },
  mdInfo: {
    type: String,
  },
});

module.exports = connection.model('About', Schema);
