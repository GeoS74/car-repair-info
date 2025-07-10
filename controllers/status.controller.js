const Status = require('../models/Status');
const mapper = require('../mappers/status.mapper');

/**
 * Cписок статусов жёстко зафиксирован и
 * в момент создания базы данных создаётся автоматически и изменению не подлежит,
 * записи получают каждый раз новые id
 * эти id документ не знает, соответственно клиент их передать не может
 *
 * Для решения этой проблемы создаётся FROZEN_LIST
 * по сути это список, в котором ключи - это значения из коллекции действий
 * значения - это ключи из коллекции действий
 *
 * также FROZEN_LIST может вызывается функциями при этом обращений к БД нет
 */

module.exports.FROZEN_LIST = new Map();
_getStatusAll().then((res) => res.map((e) => this.FROZEN_LIST.set(e.title, e.id)));

module.exports.getAll = async (ctx) => {
  const status = ctx.query?.title
    ? await _searchStatus(ctx.query.title)
    : await _getStatusAll();

  ctx.status = 200;
  ctx.body = status.map((action) => (mapper(action)));
};

function _getStatusAll() {
  return Status.find().sort({ _id: 1 });
}

async function _searchStatus(title) {
  const filter = {
    $text: {
      $search: title,
      $language: 'russian',
    },
  };

  const projection = {
    score: { $meta: 'textScore' }, // добавить в данные оценку текстового поиска (релевантность)
  };
  return Status.find(filter, projection)
    .sort({
      _id: -1,
      //  score: { $meta: "textScore" } //сортировка по релевантности
    });
}
