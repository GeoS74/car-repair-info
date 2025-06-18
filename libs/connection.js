const mongoose = require('mongoose');
const config = require('../config');

mongoose.plugin(require('mongoose-unique-validator'));

module.exports = mongoose.createConnection(
  _makeURI(),
  { autoIndex: config.mongodb.autoindex },
);

function _makeURI() {
  let uri = 'mongodb://';
  if (config.mongodb.user && config.mongodb.password) {
    uri += `${config.mongodb.user}:${config.mongodb.password}@`;
  }
  uri += `${config.mongodb.host}:${config.mongodb.port}`;
  uri += `/${config.mongodb.database}`;
  return uri;
}
