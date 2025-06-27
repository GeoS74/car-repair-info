const { isValidObjectId } = require('mongoose');
const Doc = require('../../models/Doc');

module.exports.title = async (ctx, next) => {
  if (!_checkTitle(ctx.request?.body?.title)) {
    ctx.throw(400, 'invalid task title');
  }

  await next();
};

module.exports.objectId = async (ctx, next) => {
  if (!_checkObjectId(ctx.params.id)) {
    ctx.throw(400, 'invalid task id');
  }

  await next();
};

module.exports.checkRelatedDocs = async (ctx, next) => {
  const relatedDoc = await _getRelatedDoc(ctx.params.id);
  if (relatedDoc) {
    ctx.throw(400, 'this task has associated documents');
  }

  await next();
};

function _getRelatedDoc(id) {
  return Doc.findOne({ task: id });
}

function _checkObjectId(id) {
  return isValidObjectId(id);
}

function _checkTitle(title) {
  return title?.trim();
}
