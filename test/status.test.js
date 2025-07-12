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

// переопредели модель для тестов и название API
const Model = require('../models/Status');
const apiName = 'status';

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

  describe(`${apiName} CRUD`, () => {

    it(`read ${apiName}`, async () => {
      let response = await fetch(apiPath, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);
      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
      _expectResponeArrayRows.call(this, response.data);

      const validId = response.data[0].id;
    });

    it(`search ${apiName}`, async () => {
      let response = await fetch(apiPath, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);

      const validTitle = response.data[0].title;

      response = await fetch(`${apiPath}/?title=${validTitle}fake`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);

      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
      _expectResponeArrayRows.call(this, response.data);

      response = await fetch(`${apiPath}/?title=${validTitle}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`,
        },
      })
        .then(_getData);

      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
      _expectResponeArrayRows.call(this, response.data);
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

function _expectResponeArrayRows(data) {
  expect(data, 'сервер возвращает массив')
    .that.be.an('array');

  for (const e of data) {
    expect(e, 'сервер возвращает массив объектов с полями id, title')
      .to.have.keys(['code', 'title']);
  }
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
