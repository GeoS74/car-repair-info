const { expect } = require('chai');
const fetch = require('node-fetch');
require('dotenv').config({ path: '../secrets.env' });
const connection = require('../libs/connection');
const logger = require('../libs/logger');
const config = require('../config');
const app = require('../app');
const { responseProcessing, getJWTToken } = require('./libs/testHelpers');

// переопредели модель для тестов и название API
const Model = require('../models/Action');
const apiName = 'action';

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

  describe(`${apiName} frozen list`, () => {
    // все роуты должны быть доступны при наличии access токена и только для админа
    it('check access token and check access only admin', async () => {
      let response = await fetch(apiPath)
        .then(responseProcessing);
      expect(response.status, 'если нет access токена сервер возвращает статус 401').to.be.equal(401);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(apiPath, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: {} })}` },
      })
        .then(responseProcessing);

      expect(response.status, 'если нет access токена не админский сервер возвращает статус 403').to.be.equal(403);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(apiPath, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
    });

    it(`read ${apiName}`, async () => {
      let response = await fetch(apiPath, {
        method: 'GET',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
      _expectResponeArrayRows.call(this, response.data);

      const validId = response.data[0].id;
    });

    it(`search ${apiName}`, async () => {
      let response = await fetch(apiPath, {
        method: 'GET',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);

      const validTitle = response.data[0].title;

      response = await fetch(`${apiPath}/?title=${validTitle}fake`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);

      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
      _expectResponeArrayRows.call(this, response.data);

      response = await fetch(`${apiPath}/?title=${validTitle}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);

      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
      _expectResponeArrayRows.call(this, response.data);
    });

  });
});



function _expectResponeArrayRows(data) {
  expect(data, 'сервер возвращает массив')
    .that.be.an('array');

  for (const e of data) {
    expect(e, 'сервер возвращает массив объектов с полями id, title')
      .to.have.keys(['id', 'title']);
  }
}

function _expectErrorFieldState(data) {
  expect(data, 'сервер возвращает объект с описанием ошибки')
    .that.is.an('object')
    .to.have.property('error');
}
