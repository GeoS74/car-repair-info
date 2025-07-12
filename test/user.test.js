const { expect } = require('chai');
const fetch = require('node-fetch');
const fs = require('fs/promises');
const path = require('path');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../secrets.env' });
const mongoose = require('mongoose');
const connection = require('../libs/connection');
const logger = require('../libs/logger');
const config = require('../config');
const app = require('../app');

const apiName = 'user';

if (config.node.env !== 'dev') {
  logger.warn('Error: нельзя запускать тесты в производственной среде, это может привести к потере данных');
  process.exit();
}

describe(`/test/${apiName}.test.js`, () => {
  let apiPath;
  let _server;

  before(async () => {
    _server = app.listen(0, () => { // приложение получает случайный порт
      const port = _server.address().port;
      apiPath = `http://localhost:${port}/api/informator/${apiName}`;
    });
  });

  after(async () => {
    // connection.close();
    _server.close();
  });

  describe(`${apiName}`, () => {
    // все роуты должны быть доступны при наличии access токена
    it('check access token', async () => {
      let response = await fetch(apiPath)
        .then(_getData);
      expect(response.status, 'если нет access токена сервер возвращает статус 401').to.be.equal(401);
      _expectErrorFieldState.call(this, response.data);

    });

  });
});

async function _getData(response) {
  const data = await response.json();
  return {
    status: response.status,
    data,
  };
}

function _expectErrorFieldState(data) {
  expect(data, 'сервер возвращает объект с описанием ошибки')
    .that.is.an('object')
    .to.have.property('error');
}
