module.exports = async (ctx, next) => {
  if (ctx?.user?.rank !== 'admin') {
    ctx.throw(403, 'invalid access token');
  }
  await next();
};
