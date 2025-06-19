const fs = require('fs/promises');
const path = require('path');
const Doc = require('../models/Doc');
const mapper = require('../mappers/docflow.mapper');
const logger = require('../libs/logger');
const controllerUser = require('./user.controller');

module.exports.getMe = async (ctx, next) => {
  await controllerUser.get.call(null, ctx);

  ctx.user = ctx.body;

  await next();
};

module.exports.accessDocTypes = async (ctx, next) => {
  ctx.accessDocTypes = [];

  ctx.user.roles.map((role) => (
    role.directings.map((directing) => (
      directing.tasks.map((task) => (
        ctx.accessDocTypes.push([
          directing.id,
          task.id,
          task.actions.map((action) => action.id),
        ])
      ))
    ))
  ));

  await next();
};

module.exports.get = async (ctx) => {
  const doc = await _getDoc(ctx.params.id);

  if (!doc) {
    ctx.throw(404, 'doc not found');
  }
  ctx.status = 200;
  ctx.body = mapper(doc);
};

module.exports.getAll = async (ctx) => {
  const docs = await _getDocAll(ctx.query.limit);

  ctx.status = 200;
  ctx.body = docs.map((doc) => (mapper(doc)));
};

module.exports.add = async (ctx) => {
  ctx.request.body.files = await _processingScans(ctx.scans);

  const doc = await _addDoc({
    ...ctx.request.body,
    author: ctx.user.uid,
  });

  ctx.status = 201;
  ctx.body = mapper(doc);
};

module.exports.update = async (ctx) => {
  ctx.request.body.files = await _processingScans(ctx.scans);

  const doc = await _updateDoc(ctx.params.id, ctx.request.body);

  if (!doc) {
    ctx.throw(404, 'doc not found');
  }
  ctx.status = 200;
  ctx.body = mapper(doc);
};

module.exports.delete = async (ctx) => {
  const doc = await _deleteDoc(ctx.params.id);

  if (!doc) {
    ctx.throw(404, 'doc not found');
  }

  /* delete scans */
  if (doc.files) {
    _deleteScans(doc.files);
  }

  ctx.status = 200;
  ctx.body = mapper(doc);
};

// удаление прикрепленного файла при редактировании документа
module.exports.deleteAtatchedFile = async (ctx) => {
  let doc = await _getDoc(ctx.params.id);

  if (!doc) {
    ctx.throw(404, 'doc not found');
  }

  /* delete filename from array of attached files */
  // const files = doc.files.filter((f) => f.fileName !== ctx.request.body.fileName);
  doc = await _updateAttachedFileList(doc._id, { fileName: ctx.request.body.fileName });

  /* delete scans */
  _deleteScans([{ fileName: ctx.request.body.fileName }]);

  ctx.status = 200;
  ctx.body = mapper(doc);
};

function _getDoc(id) {
  return Doc.findById(id)
    .populate('acceptor.user')
    .populate('recipient.user')
    .populate('directing')
    .populate('task')
    .populate('author');
}

function _getDocAll(limit) {
  return Doc.find()
    .sort({ _id: 1 })
    .limit(limit)
    .populate('acceptor.user')
    .populate('recipient.user')
    .populate('directing')
    .populate('task')
    .populate('author');
}

function _addDoc({
  title,
  description,
  directingId,
  taskId,
  author,
  files,
  acceptor,
  recipient,
  deadLine,
  sum,
  statusCode,
}) {
  return Doc.create({
    title,
    desc: description,
    directing: directingId,
    task: taskId,
    author,
    files,
    acceptor,
    recipient,
    deadLine,
    sum,
    statusCode,
  })
    .then((doc) => Doc.findById(doc._id)
      .populate('acceptor.user')
      .populate('recipient.user')
      .populate('directing')
      .populate('task')
      .populate('author'));
}

function _updateDoc(id, {
  title,
  description,
  files,
  acceptor,
  recipient,
  deadLine,
  sum,
  statusCode,
}) {
  return Doc.findByIdAndUpdate(
    id,
    {
      title,
      desc: description,
      $push: { files },
      acceptor,
      recipient,
      deadLine,
      sum,
      statusCode,
    },
    {
      new: true,
    },
  )
    .populate('acceptor.user')
    .populate('recipient.user')
    .populate('directing')
    .populate('task')
    .populate('author');
}

function _deleteDoc(id) {
  return Doc.findByIdAndDelete(id)
    .populate('acceptor.user')
    .populate('recipient.user')
    .populate('directing')
    .populate('task')
    .populate('author');
}

function _updateAttachedFileList(id, files) {
  return Doc.findByIdAndUpdate(
    id,
    { $pull: { files } },
    { new: true },
  )
    .populate('acceptor.user')
    .populate('recipient.user')
    .populate('directing')
    .populate('task')
    .populate('author');
}

function _deleteScans(files) {
  for (const file of files) {
    fs.unlink(`./files/scan/${file.fileName}`)
      .catch((error) => logger.error(error.mesasge));
  }
}

async function _processingScans(scans) {
  const res = [];
  for (const scan of scans) {
    await fs.rename(scan.filepath, path.join(__dirname, `../files/scan/${scan.newFilename}`))
      .catch((error) => logger.error(error.mesasge));

    res.push({
      originalName: scan.originalFilename,
      fileName: scan.newFilename,
    });
  }
  return res;
}

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
 * - author
 *
 * Поиск: user -> doc
 *
 * Важно: используются middleware getMe и accessDocTypes()
 * Поиск возвращает документы доступные пользователю
 *
 * Реализация поиска:
 * 1) собрать массив доступных для пользователя типов документов
 *    примерно такого вида:
 *    [
 *      [id_direction, id_task, [id_action, ...]],
 *      [id_direction, id_task, [id_action, ...]],
 *    ...]
 * 2) добавить в фильтр условие выборки документов с учётом доступных связок напр.-тип
 *
 */

module.exports.search = async (ctx) => {
  // _makeFilterRules выбрасывает исключение
  // поэтому добавлен блок try...catch
  try {
    const data = _makeFilterRules({
      ...ctx.query,
      accessDocTypes: ctx.accessDocTypes,
      user: ctx.user.uid,
    });
    const docs = await _searchDoc(data);

    ctx.body = docs.map((doc) => (mapper(doc)));
  } catch (error) {
    ctx.body = [];
  }

  ctx.status = 200;
};

module.exports.searchCount = async (ctx) => {
  // _makeFilterRules выбрасывает исключение
  // поэтому добавлен блок try...catch
  try {
    const data = _makeFilterRules({
      ...ctx.query,
      accessDocTypes: ctx.accessDocTypes,
      user: ctx.user.uid,
    });

    const count = await _searchDocCount(data);

    ctx.body = { count };
  } catch (error) {
    ctx.body = { count: 0 };
  }

  ctx.status = 200;
};

async function _searchDoc(data) {
  return Doc.find(data.filter, data.projection)
    .sort({
      _id: -1,
      //  score: { $meta: "textScore" } //сортировка по релевантности
    })
    .limit(data.limit)
    .populate('acceptor.user')
    .populate('recipient.user')
    .populate('directing')
    .populate('task')
    .populate('author');
}

async function _searchDocCount(data) {
  return Doc.find(data.filter)
    .sort({
      _id: -1,
    })
    .count();
}

function _makeFilterRules({
  search,
  lastId,
  limit,
  user,
  acceptor,
  recipient,
  author,
  directingId,
  taskId,
  accessDocTypes,
}) {
  const filter = {};
  const projection = {};

  if (!accessDocTypes.length) {
    throw new Error();
  }

  // кол-во условий 'и' пропорционально кол-ву доступных типов док-тов для пользователя
  // использование условия тестировалось на 5 млн. записях
  filter.$or = accessDocTypes.map((e) => ({
    $and: [
      { directing: e[0] },
      { task: e[1] },
    ],
  }));

  if (directingId) {
    filter.directing = directingId;
  }

  if (taskId) {
    filter.task = taskId;
  }

  if (search) {
    filter.$text = {
      $search: search,
      $language: 'russian',
    };

    projection.score = { $meta: 'textScore' }; // добавить в данные оценку текстового поиска (релевантность)
  }

  switch (acceptor) {
    case '0':
      filter.acceptor = { $elemMatch: { user, accept: false } };
      break;
    case '1':
      filter.acceptor = { $elemMatch: { user, accept: true } };
      break;
    case '2':
      filter.acceptor = { $elemMatch: { user } };
      break;
    default:
  }

  switch (recipient) {
    case '0':
      filter.recipient = { $elemMatch: { user, accept: false } };
      break;
    case '1':
      filter.recipient = { $elemMatch: { user, accept: true } };
      break;
    case '2':
      filter.recipient = { $elemMatch: { user } };
      break;
    default:
  }

  if (author === '1') {
    filter.author = user;
  }

  if (lastId) {
    filter._id = { $lt: lastId };
  }

  return { filter, projection, limit };
}

/**
 * подписание/ознакомление документов
 */
module.exports.accepting = async (ctx) => {
  let doc = await Doc.findById(ctx.params.id);

  if (!doc) {
    ctx.throw(404, 'doc not found');
  }

  let sign = false;

  for (const e of doc.acceptor) {
    if (e.user.toString() === ctx.user.uid.toString()) {
      e.accept = true;
      sign = true;
      break;
    }
  }

  if (!sign) {
    ctx.throw(400, 'user do not have to sign this document');
  }

  doc = await _acceptDoc(ctx.params.id, doc.acceptor);

  ctx.status = 200;
  ctx.body = mapper(doc);
};

module.exports.recipienting = async (ctx) => {
  let doc = await Doc.findById(ctx.params.id);

  if (!doc) {
    ctx.throw(404, 'doc not found');
  }

  let sign = false;

  for (const e of doc.recipient) {
    if (e.user.toString() === ctx.user.uid.toString()) {
      e.accept = true;
      sign = true;
      break;
    }
  }

  if (!sign) {
    ctx.throw(400, 'user do not have to sign this document');
  }

  doc = await _recipientDoc(ctx.params.id, doc.recipient);

  ctx.status = 200;
  ctx.body = mapper(doc);
};

function _acceptDoc(id, acceptor) {
  return Doc.findByIdAndUpdate(
    id,
    { acceptor },
    { new: true },
  )
    .populate('acceptor.user')
    .populate('recipient.user')
    .populate('directing')
    .populate('task')
    .populate('author');
}

function _recipientDoc(id, recipient) {
  return Doc.findByIdAndUpdate(
    id,
    { recipient },
    { new: true },
  )
    .populate('acceptor.user')
    .populate('recipient.user')
    .populate('directing')
    .populate('task')
    .populate('author');
}

module.exports.changeStatus = async (ctx) => {
  const doc = await _changeStatus(ctx.params.id, ctx.request.body);

  if (!doc) {
    ctx.throw(404, 'doc not found');
  }
  ctx.status = 200;
  ctx.body = mapper(doc);
};

function _changeStatus(id, {statusCode}) {
  return Doc.findByIdAndUpdate(
    id,
    {statusCode},
    {new: true, },
  )
    .populate('acceptor.user')
    .populate('recipient.user')
    .populate('directing')
    .populate('task')
    .populate('author');
}