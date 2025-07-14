const { expect } = require('chai');
const fetch = require('node-fetch');
const connection = require('../libs/connection');
const logger = require('../libs/logger');
const config = require('../config');
const app = require('../app');
const { responseProcessing, getJWTToken, getBody, getFakeObjectId } = require('./libs/testHelpers');

const Model = require('../models/User');
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
    it('check routes use access token', async () => {
      await Model.deleteMany({}); //очистить коллекцию перед тестами

      let response = await fetch(apiPath)
        .then(responseProcessing);
      expect(response.status, 'если нет access токена сервер возвращает статус 401').to.be.equal(401);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(apiPath, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: {} })}` }
      })
        .then(responseProcessing);
      expect(response.status, 'если access токена не содержит email сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru" } })}` }
      })
        .then(responseProcessing);
      expect(response.status, 'access токен верный, но пользователь не найден сервер возвращает статус 404').to.be.equal(404);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru" } })}` },
        method: 'POST'
      })
        .then(responseProcessing);
      expect(response.status, 'создать пользователя сервер возвращает статус 201').to.be.equal(201);
      _expectFieldState.call(this, response.data);
      _expectCompanyField.call(this, response.data);
      _expectRolesField.call(this, response.data);

      response = await fetch(`${apiPath}`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru" } })}` }
      })
        .then(responseProcessing);
      expect(response.status, 'пользователь найден сервер возвращает статус 200').to.be.equal(200);
      _expectFieldState.call(this, response.data);
      _expectCompanyField.call(this, response.data);
      _expectRolesField.call(this, response.data);

      response = await fetch(`${apiPath}`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "foo@foo.ru" } })}` },
        body: getBody({ name: 'foo' }),
        method: 'PATCH'
      })
        .then(responseProcessing);
      expect(response.status, 'попытка редактирования не существующего пользователя сервер возвращает статус 404').to.be.equal(404);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru" } })}` },
        body: getBody({ name: 'foo' }),
        method: 'PATCH'
      })
        .then(responseProcessing);
      expect(response.status, 'изменить имя пользователя сервер возвращает статус 200').to.be.equal(200);
      _expectFieldState.call(this, response.data);
      _expectCompanyField.call(this, response.data);
      _expectRolesField.call(this, response.data);
      expect(response.data.name, 'сервер возвращает новое значение поля name').eq('foo');

      console.log(`\t Attention: route "${apiPath}/photo" not tested`);
    });

    it('check routes only admin', async () => {
      await Model.deleteMany({}); //очистить коллекцию перед тестами

      let response = await fetch(`${apiPath}/search`)
        .then(responseProcessing);
      expect(response.status, 'если нет access токена сервер возвращает статус 401').to.be.equal(401);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/search`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: {} })}` }
      })
        .then(responseProcessing);
      expect(response.status, 'если access токена не содержит email сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/management`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru" } })}` },
        method: 'POST'
      })
        .then(responseProcessing);
      expect(response.status, 'пользователя создаёт не admin сервер возвращает статус 403').to.be.equal(403);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/management`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru", rank: "admin" } })}` },
        method: 'POST',
        body: getBody({ email: 'foo' }),
      })
        .then(responseProcessing);
      expect(response.status, 'email создаваемого пользователя не валидный сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/management`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru", rank: "admin" } })}` },
        method: 'POST',
        body: getBody({ email: 'test@test.ru' }),
      })
        .then(responseProcessing);
      expect(response.status, 'пользователь создан сервер возвращает статус 201').to.be.equal(201);
      _expectFieldState.call(this, response.data);
      _expectCompanyField.call(this, response.data);
      _expectRolesField.call(this, response.data);

      const userId = response.data.uid;

      response = await fetch(`${apiPath}/management`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru", rank: "admin" } })}` },
        method: 'POST',
        body: getBody({ email: 'test@test.ru' }),
      })
        .then(responseProcessing);
      expect(response.status, 'попытка создать пользователя если email уже был записан сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/management/fake`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'запрос пользователя не admin-ом сервер возвращает статус 403').to.be.equal(403);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/management/fake`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru", rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'запрос пользователя по не валидному id сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/management/${getFakeObjectId()}`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru", rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'запрос не существующего пользователя сервер возвращает статус 404').to.be.equal(404);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/management/${userId}`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru", rank: "admin" } })}` },
      })
        .then(responseProcessing);
      expect(response.status, 'пользователь найден сервер возвращает статус 200').to.be.equal(200);
      _expectFieldState.call(this, response.data);
      _expectCompanyField.call(this, response.data);
      _expectRolesField.call(this, response.data);

      response = await fetch(`${`${apiPath}/search`}`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru" } })}` }
      })
        .then(responseProcessing);
      expect(response.status, 'access токен верный, но пользователь не admin сервер возвращает статус 403').to.be.equal(403);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${`${apiPath}/search`}`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru", rank: "admin" } })}` }
      })
        .then(responseProcessing);
      expect(response.status, 'пользователь admin сервер возвращает статус 200').to.be.equal(200);
      _expectArrayFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/management`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru" } })}` },
        method: 'PATCH',
        body: getBody({ email: '' }),
      })
        .then(responseProcessing);
      expect(response.status, 'пользователя редактирует не admin сервер возвращает статус 403').to.be.equal(403);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/management`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru", rank: "admin" } })}` },
        method: 'PATCH',
        body: getBody({ email: ' ' }),
      })
        .then(responseProcessing);
      expect(response.status, 'редактирование пользователя по не валидному email сервер возвращает статус 400').to.be.equal(400);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/management`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru", rank: "admin" } })}` },
        method: 'PATCH',
        body: getBody({ email: 'fake@test.ru' }),
      })
        .then(responseProcessing);
      expect(response.status, 'редактирование несуществующего пользователя сервер возвращает статус 404').to.be.equal(404);
      _expectErrorFieldState.call(this, response.data);

      response = await fetch(`${apiPath}/management`, {
        headers: { Authorization: `Bearer ${getJWTToken({ user: { email: "test@test.ru", rank: "admin" } })}` },
        method: 'PATCH',
        body: getBody({ email: 'test@test.ru', name: 'bar' }),
      })
        .then(responseProcessing);
      expect(response.status, 'данные пользователя изменены сервер возвращает статус 200').to.be.equal(200);
      _expectFieldState.call(this, response.data);
      _expectCompanyField.call(this, response.data);
      _expectRolesField.call(this, response.data);
      expect(response.data.name, 'сервер возвращает новое значение поля name').eq('bar');
    });

  });
});

function _expectCompanyField({ company }) {
  expect(company, 'поле company это объект')
    .that.is.an('object');
}

function _expectRolesField({ roles }) {
  expect(roles, 'поле roles это массив')
    .that.is.an('array');
}

function _expectErrorFieldState(data) {
  expect(data, 'сервер возвращает объект с описанием ошибки')
    .that.is.an('object')
    .to.have.property('error');
}

function _expectFieldState(data) {
  expect(data, 'сервер возвращает объект с полями uid, email, photo, name, position, company, roles')
    .that.be.an('object')
    .to.have.keys(['uid', 'email', 'photo', 'name', 'position', 'company', 'roles']);
}

function _expectArrayFieldState(data) {
  expect(data, 'сервер возвращает массив')
    .that.be.an('array');

  for (const e of data) {
    expect(e, 'сервер возвращает массив объектов с полями uid, email, photo, name, position, company, roles')
      .that.be.an('object')
      .to.have.keys(['uid', 'email', 'photo', 'name', 'position', 'company', 'roles']);
  }
}