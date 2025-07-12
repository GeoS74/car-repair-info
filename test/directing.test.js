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

    // все роуты должны быть достпны при наличии access токена и только для админа
    it('check access token and check access only admin', async () => {
      const optional = {
        headers: {},
        method: 'GET',
      };

      let response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`)
      .then(_getData);
      expect(response.status, 'если нет access токена сервер возвращает статус 401').to.be.equal(401);
      _expectErrorFieldState.call(this, response.data);

      optional.headers.Authorization = `Bearer ${_getAccessTokenNOTAdmin()}`;

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, optional)
        .then(_getData);

      expect(response.status, 'если нет access токена не админский сервер возвращает статус 403').to.be.equal(403);
      _expectErrorFieldState.call(this, response.data);

      optional.headers.Authorization = `Bearer ${_getAccessTokenAdmin()}`;

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, optional)
      .then(_getData);
      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
    });

    it('create directing', async () => {
      const optional = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`
        },
        body: _getBadBody(),
      };

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, optional)
        .then(_getData);

      expect(response.status, 'поле title не передаётся сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      optional.body = _getDefaultBody();

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, optional)
        .then(_getData);

      expect(response.status, 'сервер возвращает статус 201').to.be.equal(201);
      _expectFieldState.call(this, response.data);
    });

    // перед следующими тестами, должен идти тест для создания записи

    it('read directing', async () => {
      const optional = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${_getAccessTokenAdmin()}`
        },
      };

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing`, optional)
        .then(_getData);

      expect(response.status, 'сервер возвращает статус 200').to.be.equal(200);
      _expectResponeRows.call(this, response.data);
      
      const validId = response;

      response = await fetch(`http://localhost:${config.server.port}/api/informator/directing/123`, optional)
        .then(_getData);
      
      expect(response.status, 'запрашмвается не валидный id сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      console.log(validId)
      // console.log(_getFakeId(validId))

    });

});

});

async function _getData(response) {
  return {
    status: response.status,
    data: await response.json(),
  };
}

function _getFakeId(validId){
  return validId[validId.length-1]+validId.replace(1);
}

function _expectResponeRows(data) {
  expect(data, 'сервер возвращает массив')
    .that.be.an('array');
  
  for(const e of data) {
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
    { user: {
      rank: 'admin'
    } },
    config.jwt.secretKey,
    { expiresIn: 1800 },
  );
}

function _getDefaultBody() {
  let fd = new FormData();
    fd.append('title', 'foo');
    return fd;
}

function _getBadBody() {
  let fd = new FormData();
    fd.append('titles', 'foo');
    return fd;
}
