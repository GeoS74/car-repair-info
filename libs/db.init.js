const connection = require('./connection');
const logger = require('./logger');
const config = require('../config');
const Action = require('../models/Action');
const Status = require('../models/Status');

(async () => {
  // dropped database
  if (process.argv[2] === '--drop') {
    await connection.dropDatabase()
      .then(() => logger.info(`database "${config.mongodb.database}" dropped`))
      .catch((error) => logger.warn(error.message))
      .finally(() => process.exit());
  }

  await Action.insertMany([
    { title: 'Создать' },
    { title: 'Редактировать' },
    { title: 'Удалить' },
    { title: 'Согласовать' },
    { title: 'Ознакомиться' },
    { title: 'Изменять статусы' },
  ])
    .then(() => logger.info('create and init collection "actions"'))
    .catch((error) => logger.warn(error.message));

  await Status.insertMany([
    { title: 'Новая заявка', code: 10 },
    { title: 'В работе', code: 20 },
    { title: 'На согласовании механика', code: 30 },
    { title: 'Согласовано механиком', code: 40 },
    { title: 'Согласовано заказчиком', code: 50 },
  ])
    .then(() => logger.info('create and init collection "status"'))
    .catch((error) => logger.warn(error.message))
    .finally(() => process.exit());
})();
