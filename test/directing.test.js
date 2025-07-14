const { expect } = require('chai');
const fetch = require('node-fetch');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: '../secrets.env' });
const connection = require('../libs/connection');
const logger = require('../libs/logger');
const config = require('../config');
const app = require('../app');
const { responseProcessing, getJWTToken, getBody, getFakeObjectId } = require('./libs/testHelpers');

// это универсальный тест для простых CRUD API
// переопредели модель для тестов и название API
const Model = require('../models/Directing');
const apiName = 'directing';

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
    await Model.deleteMany({});
    await fs.rm(path.join(__dirname, '../files'), { recursive: true, force: true });
    // connection.close();
    _server.close();
  });

  describe(`${apiName} CRUD`, () => {
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
      expect(response.status, 'если access токен не админский сервер возвращает статус 403').to.be.equal(403);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(apiPath, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
    });

    it(`create ${apiName}`, async () => {
      let response = await fetch(apiPath, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
        body: getBody({ foo: 'foo' }),
      })
        .then(responseProcessing);
      expect(response.status, 'поле title не передаётся сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(apiPath, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
        body: getBody({ title: 'foo' }),
      })
        .then(responseProcessing);
      expect(response.status, 'сервер возвращает статус 201').to.be.equal(201);
      _expectFieldState.call(this, response.data);
    });

    // перед следующими тестами, должен идти тест для создания записи

    it(`read ${apiName}`, async () => {
      let response = await fetch(apiPath, {
        method: 'GET',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
      _expectResponeArrayRows.call(this, response.data);

      const validId = response.data[0].id;

      response = await fetch(`${apiPath}/123`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'запрашивается не валидный id сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/${getFakeObjectId()}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'запрашивается не существующий id сервер возвращает статус 404').to.be.equal(404);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/${validId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'запись найдена сервер возвращает статус 200').to.be.equal(200);
      _expectFieldState.call(this, response.data);
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

    it(`update ${apiName}`, async () => {
      let response = await fetch(apiPath, {
        method: 'GET',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);

      const validId = response.data[0].id;

      response = await fetch(`${apiPath}/123`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
        body: getBody({ foo: 'foo' }),
      })
        .then(responseProcessing);
      expect(response.status, 'запрашивается не валидный id сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/${getFakeObjectId()}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
        body: getBody({ foo: 'foo' }),
      })
        .then(responseProcessing);
      expect(response.status, 'запрашивается не существующий id сервер возвращает статус 404').to.be.equal(404);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/${validId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
        body: getBody({ title: 'foo' }),
      })
        .then(responseProcessing);
      expect(response.status, 'запись обновляется сервер возвращает статус 200').to.be.equal(200);
      _expectFieldState.call(this, response.data);
    });

    it(`delete ${apiName}`, async () => {
      let response = await fetch(apiPath, {
        method: 'GET',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);

      const validId = response.data[0].id;

      response = await fetch(`${apiPath}/123`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'запрашивается не валидный id сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/${getFakeObjectId()}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'запрашивается не существующий id сервер возвращает статус 404').to.be.equal(404);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/${validId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'запись удаляется сервер возвращает статус 200').to.be.equal(200);
      _expectFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/${validId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getJWTToken({ user: { rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'запрашивается id удалённой записи сервер возвращает статус 404').to.be.equal(404);
      _expectErrorFieldState.call(this, response.data);
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

function _expectFieldState(data) {
  expect(data, 'сервер возвращает объект с полями id, title')
    .that.be.an('object')
    .to.have.keys(['id', 'title']);
}

function _expectErrorFieldState(data) {
  expect(data, 'сервер возвращает объект с описанием ошибки')
    .that.is.an('object')
    .to.have.property('error');
}
