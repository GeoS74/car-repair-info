const Router = require('koa-router');
const { koaBody } = require('koa-body');

const controller = require('../controllers/car.controller');
const validator = require('../middleware/validators/car.params.validator');
const validatorSearch = require('../middleware/validators/search.params.validator');
const accessCheck = require('../middleware/access.check');

const router = new Router({ prefix: '/api/informator/cars' });

router.use(accessCheck);

router.get(
  '/search/car',
  validatorSearch.searchString,
  validatorSearch.lastId,
  validatorSearch.limit,
  controller.search,
);

router.get(
  '/:id',
  validator.objectId,
  controller.get,
);

router.post(
  '/',
  koaBody({ multipart: true }),
  validator.carModel,
  validator.stateNumber,
  validator.vin,
  validator.place,
  validator.yearProduction,
  controller.add,
);

router.patch(
  '/:id',
  koaBody({ multipart: true }),
  validator.objectId,
  validator.carModel,
  validator.stateNumber,
  validator.vin,
  validator.place,
  validator.yearProduction,
  controller.update,
);

router.delete(
  '/:id',
  validator.objectId,
  validator.checkRelatedDocs,
  controller.delete,
);

module.exports = router.routes();
