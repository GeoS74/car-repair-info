const { expect } = require('chai');
const fetch = require('node-fetch');
const fs = require('fs/promises');
const path = require('path');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../secrets.env' });
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
    const optional = {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({}),
    };

    // все роуты должны быть достпны при наличии access токена и только для админа
    it('check access token and check access only admin', async () => {
      optional.method = 'GET';
      optional.body = null;

      let response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`)
      .then(_getData);
      expect(response.status, 'сервер возвращает статус 401').to.be.equal(401);
      _expectErrorFieldState.call(this, response.data);
        
      let accessToken = jwt.sign(
        { 
          user: {}
        },
        config.jwt.secretKey,
        { expiresIn: 1800 },
      );
      optional.headers.Authorization = `Bearer ${accessToken}`;

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, optional)
        .then(_getData);

      expect(response.status, 'сервер возвращает статус 403').to.be.equal(403);
      _expectErrorFieldState.call(this, response.data);

      accessToken = jwt.sign(
        { user: {
          rank: 'admin'
        } },
        config.jwt.secretKey,
        { expiresIn: 1800 },
      );

      optional.headers.Authorization = `Bearer ${accessToken}`;

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, optional)
      .then(_getData);
      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
  });

});

});

async function _getData(response) {
  return {
    status: response.status,
    data: await response.json(),
  };
}

function _expectFieldState(data) {
  expect(data, 'сервер возвращает объект с полями id, title, message, isPublic, files, createdAt, updatedAt')
    .that.be.an('object')
    .to.have.keys(['id', 'title', 'message', 'isPublic', 'files', 'createdAt', 'updatedAt']);
}

function _expectErrorFieldState(data) {
  expect(data, 'сервер возвращает объект с описанием ошибки')
    .that.is.an('object')
    .to.have.property('error');
}
