const fs = require('fs/promises');
const { isValidObjectId } = require('mongoose');

const logger = require('../../libs/logger');

module.exports.objectId = async (ctx, next) => {
  if (!_checkObjectId(ctx.params.id)) {
    ctx.throw(400, 'invalid user id');
  }

  await next();
};

module.exports.checkBodyParams = async (ctx, next) => {
  if (!_checkEmail(ctx.request?.body?.email)) {
    ctx.throw(400, 'invalid email');
  }

  if (!_checkName(ctx.request?.body?.name)) {
    ctx.throw(400, 'invalid name');
  }

  if (ctx.request?.body?.company) {
    if (!_checkObjectId(ctx.request?.body?.company)) {
      ctx.throw(400, 'invalid company');
    }
  }

  ctx.user = {
    email: ctx.request.body.email,
    name: ctx.request?.body?.name || null,
    company: ctx.request?.body?.company || null,
  };

  await next();
};

module.exports.email = async (ctx, next) => {
  if (!_checkEmail(ctx?.user?.email)) {
    ctx.throw(400, 'invalid email');
  }

  await next();
};

module.exports.params = async (ctx, next) => {
  if (!_checkName(ctx.request?.body?.name)) {
    ctx.throw(400, 'invalid name');
  }

  ctx.user = {
    email: ctx.user.email,
    name: ctx.request?.body?.name || null,
  };

  await next();
};

module.exports.photo = async (ctx, next) => {
  if (!ctx.request?.files) {
    ctx.throw(400, 'file not uploaded');
  }

  if (Object.keys(ctx.request.files).length > 1) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'more than one file received');
  }

  if (Object.keys(ctx.request.files).indexOf('photo') === -1) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'field name "photo" is empty');
  }

  if (Array.isArray(ctx.request.files.photo)) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'more than 1 file received by field "photo"');
  }

  // if (ctx.request.files.file.size < 27000) {
  //   _deleteFile(ctx.request.files);
  //   ctx.throw(400, 'file is empty');
  // }

  if (!/^image\/\w+/.test(ctx.request.files.photo.mimetype)) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'file must be image');
  }

  ctx.photo = ctx.request.files.photo;

  await next();
};

function _checkEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // return !!email;
}

function _checkName() {
  return true;
}

function _deleteFile(files) {
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

function _checkObjectId(id) {
  return isValidObjectId(id);
}
