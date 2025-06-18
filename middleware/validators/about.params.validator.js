module.exports.params = async (ctx, next) => {
  if (!_checkMdInfo(ctx.request?.body?.mdInfo)) {
    ctx.throw(400, 'invalid mdInfo');
  }

  if (!_checkAlias(ctx.request?.body?.alias)) {
    ctx.throw(400, 'invalid alias');
  }

  await next();
};

module.exports.mdInfo = async (ctx, next) => {
  if (!_checkMdInfo(ctx.request?.body?.mdInfo)) {
    ctx.throw(400, 'invalid mdInfo');
  }
  await next();
};

function _checkMdInfo(mdInfo) {
  return mdInfo?.trim();
}

function _checkAlias(alias) {
  if (!alias) {
    return false;
  }
  return /^\w[\d\s-.\w]{2,}/.test(alias);
}
