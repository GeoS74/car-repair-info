const fs = require('fs/promises');
const path = require('path');
const Comment = require('../models/Comment');
const mapper = require('../mappers/doccomment.mapper');
const logger = require('../libs/logger');
const controllerUser = require('./user.controller');

module.exports.getMe = async (ctx, next) => {
  await controllerUser.get.call(null, ctx);

  ctx.user = ctx.body;

  await next();
};

module.exports.add = async (ctx) => {
  // ctx.request.body.files = await _processingScans(ctx.scans);

  const comment = await _addComment({
    ...ctx.request.body,
    author: ctx.user.uid,
  });

  ctx.status = 201;
  ctx.body = mapper(comment);
};

function _addComment({
  comment,
  author,
  docId,
  files,
}) {
  return Comment.create({
    comment,
    author,
    doc: docId,
    files,
  })
    .then((c) => Comment.findById(c._id)
      .populate('author'));
}

module.exports.search = async (ctx) => {
  const comments = await _searchComment(ctx.query.docId);

  ctx.body = comments.map((comment) => (mapper(comment)));
  ctx.status = 200;
};

async function _searchComment(docId) {
  return Comment.find({ doc: docId })
    .sort({ _id: -1 })
    .populate('author');
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
