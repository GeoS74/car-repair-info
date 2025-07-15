const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const FormData = require('form-data');
const config = require('../../config');

module.exports.getJWTToken = (payload) => jwt.sign(
  payload,
  config.jwt.secretKey,
  { expiresIn: 1800 },
);

module.exports.responseProcessing = async (response) => {
  const data = await response.json();
  return {
    status: response.status,
    data,
  };
};

module.exports.checkObjectId = (id) => mongoose.isValidObjectId(id);

module.exports.getFakeObjectId = () => mongoose.Types.ObjectId().toString();

module.exports.getBody = (obj) => {
  const fd = new FormData();
  for (const key of Object.keys(obj)) {
    fd.append(key, obj[key]);
  }
  return fd;
};
