const { isValidObjectId } = require('mongoose');

module.exports.searchString = async (ctx, next) => {
  ctx.query.search = ctx.query.search || '';

  await next();
};

module.exports.lastId = async (ctx, next) => {
  if (ctx.query.last) {
    if (!isValidObjectId(ctx.query.last)) {
      ctx.throw(400, 'invalid last id');
    }
  }

  ctx.query.lastId = ctx.query.last;

  await next();
};

module.exports.limit = async (ctx, next) => {
  const defaultLimit = 25;

  ctx.query.limit = parseInt(ctx.query.limit, 10) || defaultLimit;
  if (ctx.query.limit > 100) {
    ctx.query.limit = defaultLimit;
  }

  await next();
};

module.exports.directingId = async (ctx, next) => {
  if (ctx.query.directing) {
    if (!isValidObjectId(ctx.query.directing)) {
      ctx.throw(400, 'invalid directing id');
    }
  }

  ctx.query.directingId = ctx.query.directing;

  await next();
};

module.exports.tascId = async (ctx, next) => {
  if (ctx.query.task) {
    if (!isValidObjectId(ctx.query.task)) {
      ctx.throw(400, 'invalid task id');
    }
  }

  ctx.query.taskId = ctx.query.task;

  await next();
};

module.exports.statusCode = async (ctx, next) => {
  ctx.query.statusCode = parseInt(ctx.query.statusCode, 10) || 0;

  await next();
};

/**
 * валидаторы acceptor, recipient, author можно не включать
 * контроллер в любом случае сравнивает значение этих параметров с определенными значениями
 * для посроения запроса
 */
module.exports.acceptor = async (ctx, next) => {
  // if(ctx.query.acceptor) {
  //   if(['0', '1', '2'].indexOf(ctx.query.acceptor) === -1) {
  //     ctx.query.acceptor = '2'
  //   }
  // }

  await next();
};

module.exports.recipient = async (ctx, next) => {
  // if(ctx.query.recipient) {
  //   if(['0', '1', '2'].indexOf(ctx.query.recipient) === -1) {
  //     ctx.query.recipient = '2'
  //   }
  // }

  await next();
};

module.exports.author = async (ctx, next) => {
  await next();
};
