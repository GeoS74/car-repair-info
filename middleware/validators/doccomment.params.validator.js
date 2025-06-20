const fs = require('fs/promises');
const { isValidObjectId } = require('mongoose');
const logger = require('../../libs/logger');
const Doc = require('../../models/Doc');

module.exports.email = async (ctx, next) => {
  if (!_checkEmail(ctx?.user?.email)) {
    ctx.throw(400, 'invalid email');
  }

  await next();
};

module.exports.checkParentDoc = async (ctx, next) => {
  const parentDoc = await _getParentDoc(ctx.request?.body?.docId);

  if (!parentDoc) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'parent doc not exist');
  }

  await next();
};

module.exports.comment = async (ctx, next) => {
  await next();
};

module.exports.objectIdByBody = async (ctx, next) => {
  if (!_checkObjectId(ctx.request?.body?.docId)) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'invalid doc id');
  }

  await next();
};

module.exports.objectIdByQuery = async (ctx, next) => {
  if (!_checkObjectId(ctx.query.docId)) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'invalid doc id');
  }

  await next();
};

function _checkObjectId(id) {
  return isValidObjectId(id);
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

async function _getParentDoc(docId) {
  return Doc.findById(docId);
}

function _checkEmail(email) {
  return !!email;
}
