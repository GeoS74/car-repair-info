const Company = require('../models/Company');
const mapper = require('../mappers/company.mapper');

module.exports.get = async (ctx) => {
  const company = await _getCompany(ctx.params.id);

  if (!company) {
    ctx.throw(404, 'company not found');
  }
  ctx.status = 200;
  ctx.body = mapper(company);
};

module.exports.getAll = async (ctx) => {
  const companies = ctx.query?.title
    ? await _searchCompanies(ctx.query.title)
    : await _getCompaniesAll();

  ctx.status = 200;
  ctx.body = companies.map((company) => (mapper(company)));
};

module.exports.add = async (ctx) => {
  const company = await _addCompany(ctx.request.body.title);
  ctx.status = 201;
  ctx.body = mapper(company);
};

module.exports.update = async (ctx) => {
  const company = await _updateCompany(ctx.params.id, ctx.request.body.title);

  if (!company) {
    ctx.throw(404, 'company not found');
  }
  ctx.status = 200;
  ctx.body = mapper(company);
};

module.exports.delete = async (ctx) => {
  const company = await _deleteCompany(ctx.params.id);

  if (!company) {
    ctx.throw(404, 'company not found');
  }

  ctx.status = 200;
  ctx.body = mapper(company);
};

function _getCompany(id) {
  return Company.findById(id);
}

function _getCompaniesAll() {
  return Company.find().sort({ _id: 1 });
}

function _addCompany(title) {
  return Company.create({ title });
}

function _updateCompany(id, title) {
  return Company.findByIdAndUpdate(
    id,
    { title },
    {
      new: true,
      runValidators: true, // запускает валидаторы схемы перед записью
    },
  );
}

function _deleteCompany(id) {
  return Company.findByIdAndDelete(id);
}

async function _searchCompanies(title) {
  const filter = {
    $text: {
      $search: title,
      $language: 'russian',
    },
  };

  const projection = {
    score: { $meta: 'textScore' }, // добавить в данные оценку текстового поиска (релевантность)
  };
  return Company.find(filter, projection)
    .sort({
      _id: -1,
      //  score: { $meta: "textScore" } //сортировка по релевантности
    });
}
