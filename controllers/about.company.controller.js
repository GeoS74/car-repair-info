const About = require('../models/About');
const mapper = require('../mappers/about.mapper');

module.exports.get = async (ctx) => {
  const about = await _getAbout(ctx.params.alias);

  if (!about) {
    ctx.throw(404, 'alias not found');
  }
  ctx.status = 200;
  ctx.body = mapper(about);
};

module.exports.getAll = async (ctx) => {
  const abouts = await _getAboutAll();

  ctx.status = 200;
  ctx.body = abouts.map((about) => (mapper(about)));
};

module.exports.add = async (ctx) => {
  const about = await _addAbout(ctx.request.body.alias, ctx.request.body.mdInfo);
  ctx.status = 201;
  ctx.body = mapper(about);
};

module.exports.update = async (ctx) => {
  const about = await _updateAbout(ctx.request.body.alias, ctx.request.body.mdInfo);

  if (!about) {
    ctx.throw(404, 'alias page not found');
  }
  ctx.status = 200;
  ctx.body = mapper(about);
};

module.exports.delete = async (ctx) => {
  const about = await _deleteAbout(ctx.params.alias);

  if (!about) {
    ctx.throw(404, 'alias page not found');
  }
  ctx.status = 200;
  ctx.body = mapper(about);
};

function _getAbout(alias) {
  return About.findOne({ alias });
}

function _getAboutAll() {
  return About.find().sort({ _id: 1 });
}

function _addAbout(alias, mdInfo) {
  return About.create({ alias, mdInfo });
}

function _updateAbout(alias, mdInfo) {
  return About.findOneAndUpdate(
    { alias },
    { mdInfo },
    {
      new: true,
      runValidators: true, // запускает валидаторы схемы перед записью
    },
  );
}

function _deleteAbout(alias) {
  return About.findOneAndDelete({ alias });
}
