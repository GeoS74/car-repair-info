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
const Directing = require('../models/Directing');

if (config.node.env !== 'dev') {
  logger.warn('Error: нельзя запускать тесты в производственной среде, это может привести к потере данных');
  process.exit();
}

describe('/test/directing.test.js', () => {
  let _server;

  before(async () => {
    _server = app.listen(config.server.port);
  });

  after(async () => {
    await Directing.deleteMany({});
    await fs.rm(path.join(__dirname, '../files'), { recursive: true, force: true });
    connection.close();
    _server.close();
  });

  describe('directing CRUD', () => {
    // все роуты должны быть достпны при наличии access токена и только для админа
    it('check access token and check access only admin', async () => {
      let response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`)
        .then(_getData);
      expect(response.status, 'если нет access токена сервер возвращает статус 401').to.be.equal(401);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, {
        headers: {
          Authorization: `Bearer ${_getAccessTokenNOTAdmin()}`,
        },
      })
        .then(_getData);

      expect(response.status, 'если нет access токена не админский сервер возвращает статус 403').to.be.equal(403);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, {
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);
      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
    });

    it('create directing', async () => {
      let response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
        body: _getBadBody(),
      })
        .then(_getData);
      expect(response.status, 'поле title не передаётся сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
        body: _getDefaultBody(),
      })
        .then(_getData);
      expect(response.status, 'сервер возвращает статус 201').to.be.equal(201);
      _expectFieldState.call(this, response.data);
    });

    // перед следующими тестами, должен идти тест для создания записи

    it('read directing', async () => {
      let response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);
      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
      _expectResponeArrayRows.call(this, response.data);

      const validId = response.data[0].id;

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing/123`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);
      expect(response.status, 'запрашивается не валидный id сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing/${_getFakeId()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);
      expect(response.status, 'запрашивается не существующий id сервер возвращает статус 404').to.be.equal(404);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing/${validId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);
      expect(response.status, 'запись найдена сервер возвращает статус 200').to.be.equal(200);
      _expectFieldState.call(this, response.data);
    });

    it('search directing', async () => {
      let response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);
      
      const validTitle = response.data[0].title;

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing/?title=${validTitle}fake`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);

      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
      _expectResponeArrayRows.call(this, response.data);

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing/?title=${validTitle}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);

      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
      _expectResponeArrayRows.call(this, response.data);
    });

    it('update directing', async () => {
      let response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);

      const validId = response.data[0].id;

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing/123`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
        body: _getBadBody(),
      })
        .then(_getData);
      expect(response.status, 'запрашивается не валидный id сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing/${_getFakeId()}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
        body: _getBadBody(),
      })
        .then(_getData);
      expect(response.status, 'запрашивается не существующий id сервер возвращает статус 404').to.be.equal(404);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing/${validId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
        body: _getDefaultBody(),
      })
        .then(_getData);
      expect(response.status, 'запись обновляется сервер возвращает статус 200').to.be.equal(200);
      _expectFieldState.call(this, response.data);
    });

    it('delete directing', async () => {
      let response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);

      const validId = response.data[0].id;

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing/123`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        }
      })
        .then(_getData);
      expect(response.status, 'запрашивается не валидный id сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing/${_getFakeId()}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        }
      })
        .then(_getData);
      expect(response.status, 'запрашивается не существующий id сервер возвращает статус 404').to.be.equal(404);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing/${validId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        }
      })
        .then(_getData);
      expect(response.status, 'запись удаляется сервер возвращает статус 200').to.be.equal(200);
      _expectFieldState.call(this, response.data);

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing/${validId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        }
      })
        .then(_getData);
      expect(response.status, 'запрашивается id удалённой записи сервер возвращает статус 404').to.be.equal(404);
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

function _getFakeId() {
  return mongoose.Types.ObjectId().toString();
}

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

function _getAccessTokenNOTAdmin() {
  return jwt.sign(
    { user: {} },
    config.jwt.secretKey,
    { expiresIn: 1800 },
  );
}

function _getAccessTokenAdmin() {
  return jwt.sign(
    {
      user: {
        rank: 'admin',
      },
    },
    config.jwt.secretKey,
    { expiresIn: 1800 },
  );
}

function _getDefaultBody() {
  const fd = new FormData();
  fd.append('title', 'foo');
  return fd;
}

function _getBadBody() {
  const fd = new FormData();
  fd.append('foo', 'foo');
  return fd;
}
