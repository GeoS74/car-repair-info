const fs = require('fs/promises');
const sharp = require('sharp');

const logger = require('../libs/logger');

const User = require('../models/User');
const Role = require('../models/Role');
const mapper = require('../mappers/user.mapper');
const actions = require('./action.controller');

/**
 * поиск пользователя
 *
 * возможные параметры запроса:
 * - search
 * - last
 * - limit
 * - directingId
 * - taskId
 * - acceptor
 * - recipient
 *
 * Поиск: doc -> user
 * Если передаются одновременно параметры directingId и taskId
 * то предполагается, что поиск инициирцется документом
 * документ, в свою очередь всегда знает направление и свой тип
 * Возвращается массив пользователей, которым доступен данный тип документа
 * Возвращается пустой массив если тип документа не доступен ни одному пользователю
 *
 * Реализация поиска:
 * 1) собрать массив ролей, которые могут взаимодействовать
 *    с данным типом документа (см. фнкцию _makeRolesByDirectingAndTask)
 * 2) добавить в фильтр условие для выборки пользователей с учётом ролей
 *
 */

module.exports.search = async (ctx) => {
  // _makeFilterRules выбрасывает исключение
  // поэтому добавлен блок try...catch
  try {
    const data = await _makeFilterRules(ctx.query);
    const users = await _searchUsers(data);

    ctx.body = users.map((user) => mapper(user));
  } catch (error) {
    ctx.body = [];
  }
  ctx.status = 200;
};

async function _searchUsers(data) {
  return User.find(data.filter)
    .sort({ _id: 1 })
    .limit(data.limit)
    .populate({
      path: 'roles',
      populate: [
        { path: 'directings.directing' },
        { path: 'directings.tasks.task' },
        { path: 'directings.tasks.actions' },
      ],
    });
}

/**
 * условие выбора пользователей по типу документа
 * может включать в себя дополнительные условия,
 * связанные с настройками возможных действий
 *
 * Cписок действий жёстко зафиксирован и
 * в момент создания базы данных создаётся автоматически и изменению не подлежит,
 * записи получают каждый раз новые id
 * эти id документ не знает, соответственно клиент их передать не может
 *
 * Для решения этой проблемы используется FROZEN_LIST
 * по сути это список, в котором ключи - это значения из коллекции действий
 * значения - это ключи из коллекции действий
 *
 * таким образом _makeRolesByDirectingAndTask может добавлять id действий
 * в условие выборки
 */

async function _makeRolesByDirectingAndTask(directingId, taskId, acceptor, recipient) {
  const filter = {
    directings: {
      $elemMatch: {
        directing: directingId,
        tasks: {
          $elemMatch: {
            task: taskId,
            // actions: {$in: act}
          },
        },
      },
    },
  };

  const act = [];
  if (acceptor === '1') {
    act.push(actions.FROZEN_LIST.get('Согласовать'));
  }
  if (recipient === '1') {
    act.push(actions.FROZEN_LIST.get('Ознакомиться'));
  }

  // добавить массив действий в условие выборки
  if (act.length) {
    filter.directings.$elemMatch.tasks.$elemMatch.actions = { $in: act };
  }

  return Role.find(filter)
    .then((res) => res.map((e) => e._id));
}

async function _makeFilterRules({
  search,
  lastId,
  limit,
  acceptor,
  recipient,
  directingId,
  taskId,
}) {
  const filter = {};

  if (directingId && taskId) {
    const roles = await _makeRolesByDirectingAndTask(directingId, taskId, acceptor, recipient);
    if (!roles.length) {
      throw new Error();
    }
    filter.roles = { $in: roles };
  }

  if (search) {
    filter.fullName = {
      $regex: new RegExp(`${search}`),
      $options: 'i',
    };
  }

  if (lastId) {
    filter._id = { $lt: lastId };
  }

  return { filter, limit };
}

module.exports.get = async (ctx) => {
  const user = await _getUser(ctx.user);
  if (!user) {
    ctx.throw(404, 'user not found');
  }

  ctx.status = 200;
  ctx.body = mapper(user);
};

module.exports.getAll = async (ctx) => {
  const users = await _getAllUsers();

  ctx.status = 200;
  ctx.body = users.map((user) => mapper(user));
};

module.exports.add = async (ctx) => {
  const user = await _addUser(ctx.user);

  ctx.status = 201;
  ctx.body = mapper(user);
};

module.exports.update = async (ctx) => {
  const user = await _updateUser(ctx.user);
  if (!user) {
    ctx.throw(404, 'user not found');
  }

  // обновить название должности и fullName
  await user.setPosition().save();

  ctx.status = 200;
  ctx.body = mapper(user);
};

module.exports.delete = async (ctx) => {
  const user = await _delUser(ctx.user);
  if (!user) {
    ctx.throw(404, 'user not found');
  }

  /* delete photo */
  if (user?.photo) {
    _deleteFile(`./files/photo/${user.photo}`);
  }

  ctx.status = 200;
  ctx.body = mapper(user);
};

module.exports.photo = async (ctx) => {
  const user = await _updatePhoto(ctx.user.email, ctx.photo.newFilename);

  if (!user) {
    _deleteFile(ctx.photo.filepath);
    ctx.throw(404, 'user not found');
  }

  /* delete old photo */
  if (user?.photo) {
    _deleteFile(`./files/photo/${user.photo}`);
  }

  // await fs.rename(ctx.photo.filepath, `./files/photo/${ctx.photo.newFilename}`);

  /* change size photo */
  await _processingPhoto(ctx.photo)
    .catch((error) => ctx.throw(400, `error resizing photo: ${error.message}`));

  _deleteFile(ctx.photo.filepath);

  await this.get(ctx);
};

function _getUser({ email }) {
  return User.findOne({ email })
    .populate({
      path: 'roles',
      populate: [
        { path: 'directings.directing' },
        { path: 'directings.tasks.task' },
        { path: 'directings.tasks.actions' },
      ],
    });
}

function _getAllUsers() {
  return User.find().sort({ _id: 1 })
    .populate({
      path: 'roles',
      populate: [
        { path: 'directings.directing' },
        { path: 'directings.tasks.task' },
        { path: 'directings.tasks.actions' },
      ],
    });
}

function _addUser({ email, name }) {
  return User.create({
    email,
    name,
  });
}

function _updateUser({ email, name }) {
  return User.findOneAndUpdate(
    { email },
    { name },
    {
      new: true,
      runValidators: true, // запускает валидаторы схемы перед записью
    },
  )
    .populate({
      path: 'roles',
      populate: [
        { path: 'directings.directing' },
        { path: 'directings.tasks.task' },
        { path: 'directings.tasks.actions' },
      ],
    });
}

function _delUser({ email }) {
  return User.findOneAndDelete(
    { email },
  )
    .populate({
      path: 'roles',
      populate: [
        { path: 'directings.directing' },
        { path: 'directings.tasks.task' },
        { path: 'directings.tasks.actions' },
      ],
    });
}

function _updatePhoto(email, photo) {
  return User.findOneAndUpdate(
    { email },
    { photo },
    {
      new: false,
      runValidators: true, // запускает валидаторы схемы перед записью
    },
  );
}

function _deleteFile(fpath) {
  fs.unlink(fpath)
    .catch((error) => logger.error(`delete file: ${error.message}`));
}

function _processingPhoto({ filepath, newFilename }) {
  return sharp(filepath)
    .resize({
      width: 160,
      height: 160,
    })
    .toFile(`./files/photo/${newFilename}`);
}
