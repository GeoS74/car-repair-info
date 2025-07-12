const { isValidObjectId } = require('mongoose');
const User = require('../../models/User');

module.exports.title = async (ctx, next) => {
  if (!_checkTitle(ctx.request?.body?.title)) {
    ctx.throw(400, 'invalid company title');
  }

  await next();
};

module.exports.objectId = async (ctx, next) => {
  if (!_checkObjectId(ctx.params.id)) {
    ctx.throw(400, 'invalid company id');
  }

  await next();
};

module.exports.checkRelatedUsers = async (ctx, next) => {
  const relatedUsers = await _getRelatedUsers(ctx.params.id);
  if (relatedUsers) {
    ctx.throw(400, 'this companyRoutes has associated users');
  }

  await next();
};

function _getRelatedUsers(id) {
  return User.findOne({ company: id });
}

function _checkObjectId(id) {
  return isValidObjectId(id);
}

function _checkTitle(title) {
  return title?.trim();
}
