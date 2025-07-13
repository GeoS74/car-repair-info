const connection = require('./connection');
const logger = require('./logger');
const config = require('../config');
const Action = require('../models/Action');
const Status = require('../models/Status');
const Task = require('../models/Task');

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

  await Task.insertMany([
    { title: 'Заказ-наряд' },
  ])
    .then(() => logger.info('create and init collection "tasks"'))
    .catch((error) => logger.warn(error.message));

  await Status.insertMany([
    { title: 'Новая заявка', code: 10 },
    { title: 'В работе', code: 20 },
    { title: 'Согласование', code: 30 },
    { title: 'Согласовано механиком', code: 40 },
    { title: 'Ремонт завершен', code: 50 },
    { title: 'Согласовано заказчиком', code: 60 },
    { title: 'Выложено в ЭДО', code: 70 },
    { title: 'Подписано в ЭДО', code: 80 },
    { title: 'Оплачено', code: 90 },
  ])
    .then(() => logger.info('create and init collection "status"'))
    .catch((error) => logger.warn(error.message))
    .finally(() => process.exit());
})();
