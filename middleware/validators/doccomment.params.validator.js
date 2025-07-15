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
  ctx.request.body.comment = ctx.request.body?.comment?.trim();
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

module.exports.commentsNotBeEmpty = async (ctx, next) => {
  if (!ctx.scans.length && !ctx.request.body.comment) {
    ctx.throw(400, 'comment not be empty');
  }
  await next();
};

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
