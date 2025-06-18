const { isValidObjectId } = require('mongoose');

module.exports.objectId = async (ctx, next) => {
  if (!_checkObjectId(ctx.params.id)) {
    ctx.throw(400, 'invalid id');
  }

  await next();
};

// если id роли не передаётся, то роль отвязывается от пользователя
module.exports.roleId = async (ctx, next) => {
  if (!ctx.request?.body?.roleId) {
    await next();
    return;
  }

  if (!_checkObjectId(ctx.request.body.roleId)) {
    ctx.throw(400, 'invalid role id');
  }

  await next();
};

module.exports.email = async (ctx, next) => {
  if (!_checkEmail(ctx.request?.body?.email)) {
    ctx.throw(400, 'invalid email');
  }

  await next();
};

function _checkEmail(email) {
  return /^[-.\w]+@([\w-]+\.)+[\w-]{2,12}$/.test(email);
}

function _checkObjectId(id) {
  return isValidObjectId(id);
}
