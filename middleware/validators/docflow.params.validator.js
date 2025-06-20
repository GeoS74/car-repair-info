const fs = require('fs/promises');
const { isValidObjectId } = require('mongoose');
const controllerDoc = require('../../controllers/docflow.controller');
const actions = require('../../controllers/action.controller');
const logger = require('../../libs/logger');
const Status = require('../../models/Status');

// ATTENTION: use this validator only after directingId and taskId validate
// если у пользователя есть права на взаимодействие с типом документа
// валидатор сжимает массив ctx.accessDocTypes до одного элемента
module.exports.checkAccessDocTypes = async (ctx, next) => {
  let access = false;

  for (const e of ctx.accessDocTypes) {
    if (e[0] === ctx.request.body.directingId) {
      if (e[1] === ctx.request.body.taskId) {
        ctx.accessDocTypes = e; // валидатор сжимает массив ctx.accessDocTypes до одного элемента
        access = true;
        break;
      }
    }
  }

  if (!access) {
    _deleteFile(ctx.request.files);
    ctx.throw(403, 'access to the document type is denied');
  }

  await next();
};

// ATTENTION: use this validator only after objectId params validate
// если у пользователя есть права на взаимодействие с типом документа
// валидатор сжимает массив ctx.accessDocTypes до одного элемента
module.exports.checkAccessDocTypesById = async (ctx, next) => {
  let access = false;

  await controllerDoc.get.call(null, ctx);

  const doc = ctx.body;

  for (const e of ctx.accessDocTypes) {
    if (e[0] === doc.directing.id.toString()) {
      if (e[1] === doc.task.id.toString()) {
        ctx.accessDocTypes = e; // валидатор сжимает массив ctx.accessDocTypes до одного элемента
        access = true;
        break;
      }
    }
  }

  if (!access) {
    _deleteFile(ctx.request.files);
    ctx.throw(403, 'access to the document type is denied');
  }

  await next();
};

module.exports.checkRightOnCreate = async (ctx, next) => {
  if (ctx.accessDocTypes[2].indexOf(actions.FROZEN_LIST.get('Создать')) === -1) {
    _deleteFile(ctx.request.files);
    ctx.throw(403, 'create to the document type is denied');
  }

  await next();
};

module.exports.checkRightOnUpdate = async (ctx, next) => {
  if (ctx.accessDocTypes[2].indexOf(actions.FROZEN_LIST.get('Редактировать')) === -1) {
    _deleteFile(ctx.request.files);
    ctx.throw(403, 'update to the document type is denied');
  }

  await next();
};

module.exports.checkRightOnDelete = async (ctx, next) => {
  if (ctx.accessDocTypes[2].indexOf(actions.FROZEN_LIST.get('Удалить')) === -1) {
    _deleteFile(ctx.request.files);
    ctx.throw(403, 'delete to the document type is denied');
  }

  await next();
};

module.exports.checkRightOnAccepting = async (ctx, next) => {
  if (ctx.accessDocTypes[2].indexOf(actions.FROZEN_LIST.get('Согласовать')) === -1) {
    _deleteFile(ctx.request.files);
    ctx.throw(403, 'accept to the document type is denied');
  }

  await next();
};

module.exports.checkRightOnRecipienting = async (ctx, next) => {
  if (ctx.accessDocTypes[2].indexOf(actions.FROZEN_LIST.get('Ознакомиться')) === -1) {
    _deleteFile(ctx.request.files);
    ctx.throw(403, 'agreed to the document type is denied');
  }

  await next();
};

module.exports.checkRightOnChangeStatus = async (ctx, next) => {
  if (ctx.accessDocTypes[2].indexOf(actions.FROZEN_LIST.get('Изменять статусы')) === -1) {
    _deleteFile(ctx.request.files);
    ctx.throw(403, 'change status to the document type is denied');
  }

  await next();
};

module.exports.title = async (ctx, next) => {
  if (!_checkTitle(ctx.request?.body?.title)) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'invalid title');
  }

  await next();
};

module.exports.objectId = async (ctx, next) => {
  if (!_checkObjectId(ctx.params.id)) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'invalid doc id');
  }

  await next();
};

module.exports.directingId = async (ctx, next) => {
  if (!_checkObjectId(ctx.request?.body?.directingId)) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'invalid directing id');
  }

  await next();
};

module.exports.taskId = async (ctx, next) => {
  if (!_checkObjectId(ctx.request?.body?.taskId)) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'invalid task id');
  }

  await next();
};

// module.exports.author = async (ctx, next) => {
//   if (!_checkObjectId(ctx.request?.body?.author)) {
//     _deleteFile(ctx.request.files);
//     ctx.throw(400, 'invalid doc author');
//   }

//   await next();
// };

module.exports.scanCopy = async (ctx, next) => {
  if (Object.keys(ctx.request.files).indexOf('scans') === -1) {
    _deleteFile(ctx.request.files);
    ctx.scans = [];
    await next();
    return;
  }

  const files = Array.isArray(ctx.request.files.scans)
    ? ctx.request.files.scans : [ctx.request.files.scans];

  for (const file of files) {
    if (!_checkMimeType(file.mimetype)) {
      _deleteFile(ctx.request.files);
      ctx.throw(400, 'bad mime type');
      return;
    }
  }

  ctx.scans = files;

  await next();
};

module.exports.lastId = async (ctx, next) => {
  if (ctx.query.last) {
    if (!_checkObjectId(ctx.query.last)) {
      ctx.throw(400, 'invalid last id');
    }
  }

  ctx.query.lastId = ctx.query.last;

  await next();
};

module.exports.limit = async (ctx, next) => {
  ctx.query.limit = parseInt(ctx.query.limit, 10) || 50;

  await next();
};

module.exports.acceptor = async (ctx, next) => {
  const acceptor = [];

  for (const uid in ctx.request?.body?.acceptor) {
    if ({}.hasOwnProperty.call(ctx.request.body.acceptor, uid)) {
      if (!_checkObjectId(uid)) {
        _deleteFile(ctx.request.files);
        ctx.throw(400, 'invalid acceptor uid');
      }
      acceptor.push({
        user: uid,
        accept: !!ctx.request.body.acceptor[uid],
      });
    }
  }

  ctx.request.body.acceptor = acceptor;

  await next();
};

module.exports.recipient = async (ctx, next) => {
  const recipient = [];

  for (const uid in ctx.request?.body?.recipient) {
    if ({}.hasOwnProperty.call(ctx.request.body.recipient, uid)) {
      if (!_checkObjectId(uid)) {
        _deleteFile(ctx.request.files);
        ctx.throw(400, 'invalid recipient uid');
      }
      recipient.push({
        user: uid,
        accept: !!ctx.request.body.recipient[uid],
      });
    }
  }

  ctx.request.body.recipient = recipient;

  await next();
};

module.exports.email = async (ctx, next) => {
  if (!_checkEmail(ctx?.user?.email)) {
    ctx.throw(400, 'invalid email');
  }

  await next();
};

module.exports.checkStatusCode = async (ctx, next) => {
  const statusCode = parseInt(ctx.request?.body?.statusCode, 10) || 0;
  const status = await _getStatus(statusCode);

  if (!status) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'invalid status code');
  }

  ctx.request.body.statusCode = statusCode;

  await next();
};

async function _getStatus(statusCode) {
  return Status.findOne({ code: statusCode });
}

function _checkEmail(email) {
  return !!email;
}

function _checkMimeType(mimeType) {
  if (/^image\/\w+/.test(mimeType)) {
    return true;
  }
  if (/^application\/pdf/.test(mimeType)) {
    return true;
  }
  if (/^application\/vnd\.\w+/.test(mimeType)) {
    return true;
  }
  if (/^application\/msword/.test(mimeType)) {
    return true;
  }
  return false;
}

function _checkObjectId(id) {
  return isValidObjectId(id);
}

function _checkTitle(title) {
  return title?.trim();
}

function _deleteFile(files) {
  if (files) {
    for (const file of Object.values(files)) {
      // received more than 1 file in any field with the same name
      if (Array.isArray(file)) {
        _deleteFile(file);
      } else {
        fs.unlink(file.filepath)
          .catch((error) => logger.error(error.mesasge));
      }
    }
  }
}
