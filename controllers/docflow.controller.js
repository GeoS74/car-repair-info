const fs = require('fs/promises');
const mongoose = require('mongoose');
const path = require('path');
const Doc = require('../models/Doc');
const Comment = require('../models/Comment');
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

  /* delete comments */
  _deleteRelatedComments(doc.id);

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

function _deleteRelatedComments(docId) {
  return Comment.deleteMany({ doc: docId })
    .catch((error) => logger.error(error.mesasge));
}

function _getDoc(id) {
  return Doc.findById(id)
    .populate('acceptor.user')
    .populate('recipient.user')
    .populate('directing')
    .populate('task')
    .populate('author')
    .populate('car');
}

function _getDocAll(limit) {
  return Doc.find()
    .sort({ _id: 1 })
    .limit(limit)
    .populate('acceptor.user')
    .populate('recipient.user')
    .populate('directing')
    .populate('task')
    .populate('author')
    .populate('car');
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
  carId,
  mileage,
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
    car: carId || undefined,
    mileage,
  })
    .then((doc) => Doc.findById(doc._id)
      .populate('acceptor.user')
      .populate('recipient.user')
      .populate('directing')
      .populate('task')
      .populate('author')
      .populate('car'));
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
    .populate('author')
    .populate('car');
}

function _deleteDoc(id) {
  return Doc.findByIdAndDelete(id)
    .populate('acceptor.user')
    .populate('recipient.user')
    .populate('directing')
    .populate('task')
    .populate('author')
    .populate('car');
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
    .populate('author')
    .populate('car');
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
    .populate('author')
    .populate('car');
}

async function _searchDocCount(data) {
  return Doc.find(data.filter).count();
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
  statusCode,
}) {
  const filter = {};
  const projection = {};

  if (!accessDocTypes.length) {
    throw new Error();
  }

  // кол-во условий 'и' пропорционально кол-ву доступных типов док-тов для пользователя
  // использование условия тестировалось на 5 млн. записях
  // filter.$or = accessDocTypes.map((e) => ({
  //   $and: [
  //     { directing: e[0] },
  //     { task: e[1] },
  //   ],
  // }));
  filter.$or = accessDocTypes.map((e) => ({
    directing: e[0],
    task: e[1],
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

  if (statusCode) {
    filter.statusCode = statusCode;
  }

  return { filter, projection, limit };
}

module.exports.searchByDocAndCar = async (ctx) => {
  // _makePipeline выбрасывает исключение
  // поэтому добавлен блок try...catch
  try {
    const pipeline = _makePipeline({
      ...ctx.query,
      accessDocTypes: ctx.accessDocTypes,
      user: ctx.user.uid,
    });
    const docs = await _searchByDocAndCar(pipeline);

    // ctx.body = docs;
    ctx.body = docs.map((doc) => (mapper(doc)));
  } catch (error) {
    ctx.body = [];
  }

  ctx.status = 200;
};

async function _searchByDocAndCar(pipeline) {
  return Doc.aggregate(pipeline); // .explain("executionStats");
}

function _makePipeline({
  search,
  lastId,
  limit,
  user,
  // acceptor,
  // recipient,
  author,
  directingId,
  taskId,
  accessDocTypes,
  statusCode,
}) {
  const pipeline = [];
  const sort = { _id: -1 };

  if (!accessDocTypes.length) {
    throw new Error();
  }

  pipeline.push({ $sort: sort });

  // STAGE 1
  const matchRulesStage1 = {
    $match: { $and: [] },
  };

  matchRulesStage1.$match.$and.push({
    $or: accessDocTypes.map((e) => ({
      directing: new mongoose.Types.ObjectId(e[0]),
      task: new mongoose.Types.ObjectId(e[1]),
    })),
  });

  if (statusCode) {
    matchRulesStage1.$match.$and.push({ statusCode });
  }

  if (directingId) {
    matchRulesStage1.$match.$and.push({ directing: new mongoose.Types.ObjectId(directingId) });
  }

  if (taskId) {
    matchRulesStage1.$match.$and.push({ task: new mongoose.Types.ObjectId(taskId) });
  }

  if (lastId) {
    matchRulesStage1.$match.$and.push({ _id: { $lt: new mongoose.Types.ObjectId(lastId) } });
  }

  if (author === '1') {
    matchRulesStage1.$match.$and.push({ author: new mongoose.Types.ObjectId(user) });
  }

  if (matchRulesStage1.$match.$and.length) {
    pipeline.push(matchRulesStage1);
  }
  pipeline.push({ $limit: limit }); // limit для документов STAGE 1

   // STAGE 2
   if (search && limit) {
    pipeline.push(..._getSearhPipeline(search, limit, sort));
  }

  // STAGE 3
  pipeline.push(
    {
      $lookup: {
        from: 'users',
        let: { authorId: '$author' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$authorId'] } } },
        ],
        as: 'author',
      },
    },
    {
      $addFields: {
        author: { $arrayElemAt: ['$author', 0] }, // Преобразуем массив в объект
      },
    },
    {
      $lookup: {
        from: 'tasks',
        let: { taskId: '$task' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$taskId'] } } },
        ],
        as: 'task',
      },
    },
    {
      $addFields: {
        task: { $arrayElemAt: ['$task', 0] }, // Преобразуем массив в объект
      },
    },
    {
      $lookup: {
        from: 'directings',
        let: { directingId: '$directing' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$directingId'] } } },
        ],
        as: 'directing',
      },
    },
    {
      $addFields: {
        directing: { $arrayElemAt: ['$directing', 0] }, // Преобразуем массив в объект
      },
    },
  );

  // pipeline.push({ $sort: { _id: -11 } });

  return pipeline;
}

// 1.1. Сначала ищутся документы в коллекции docs,
//      где title содержит подстроку search (регистронезависимо).
// 1.2. Для каждого найденного документа подтягивается связанный автомобиль из коллекции cars.
// 1.3. Результаты помечаются как type: "doc".

// 2.1 Ищутся автомобили в коллекции cars, где searchCombined содержит подстроку search.
// 2.2 Для каждого найденного автомобиля подтягиваются связанные документы из docs.
// 2.3 Результаты помечаются как type: "car".

// 3.1 $group устраняет дубликаты (если документ найден и через docs, и через cars).
// 3.2 types содержит все способы, которыми был найден документ (например, ["doc", "car"]).
// 3.3 $limit применяется уже к объединённым результатам.

// Это не параллельный поиск. MongoDB сначала обрабатывает первую часть конвейера, затем вторую.
function _getSearhPipeline(search, limit, sort) {
  return [
    // Этап 1: Поиск документов с совпадениями (левая часть JOIN)
    {
      $match: { title: { $regex: search, $options: 'i' } },
    },
    {
      $lookup: {
        from: 'cars',
        localField: 'car',
        foreignField: '_id',
        as: 'car',
      },
    },
    { $unwind: { path: '$car', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        doc: '$$ROOT',
        type: { $literal: 'doc' }, // Помечаем документы из Doc
      },
    },
    { $limit: limit }, // limit для документов

    // Этап 2: Поиск автомобилей с совпадениями (правая часть JOIN)
    {
      $unionWith: {
        coll: 'cars',
        pipeline: [
          {
            $match: { searchCombined: { $regex: search, $options: 'i' } },
          },
          { $limit: limit }, // limit для авто
          {
            $lookup: {
              from: 'docs',
              localField: '_id',
              foreignField: 'car',
              as: 'doc',
            },
          },
          { $unwind: { path: '$doc', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: '$doc._id',
              doc: {
                $mergeObjects: [
                  '$doc',
                  { car: '$$ROOT' },
                ],
              },
              type: { $literal: 'car' }, // Помечаем документы из Car
            },
          },
        ],
      },
    },

    // Этап 3: Объединение и дедупликация
    {
      $group: {
        _id: '$_id', // Группируем по ID документа
        doc: { $first: '$doc' }, // Берем первую версию документа
        types: { $addToSet: '$type' }, // Сохраняем все типы (doc/car)
      },
    },
    {
      $replaceRoot: { newRoot: '$doc' }, // Оставляем только данные документа
    },
    // { $limit: limit } // финальный limit (опционально)
    {$sort: sort} // сортировка результатов STAGE 2 (обязательно)
  ];
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
    .populate('author')
    .populate('car');
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
    .populate('author')
    .populate('car');
}

module.exports.changeStatus = async (ctx) => {
  const doc = await _changeStatus(ctx.params.id, ctx.request.body);

  if (!doc) {
    ctx.throw(404, 'doc not found');
  }
  ctx.status = 200;
  ctx.body = mapper(doc);
};

function _changeStatus(id, { statusCode }) {
  return Doc.findByIdAndUpdate(
    id,
    { statusCode },
    { new: true },
  )
    .populate('acceptor.user')
    .populate('recipient.user')
    .populate('directing')
    .populate('task')
    .populate('author')
    .populate('car');
}
