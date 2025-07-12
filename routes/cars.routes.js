const { readdir, mkdir } = require('node:fs/promises');
const Router = require('koa-router');
const { koaBody } = require('koa-body');

const controller = require('../controllers/car.controller');
const validator = require('../middleware/validators/car.params.validator');
const validatorExcel = require('../middleware/validators/car.excel.params.validator');
const validatorSearch = require('../middleware/validators/search.params.validator');
const accessCheck = require('../middleware/access.check');
const isAdmin = require('../middleware/isAdmin');
// const excelReader = require('../middleware/excel.reader');

(async () => {
  try {
    await readdir('./files/temp');
  } catch (error) {
    mkdir('./files/temp', {
      recursive: true,
    });
  }
})();

const optional = {
  formidable: {
    uploadDir: './files/temp',
    allowEmptyFiles: false,
    minFileSize: 1,
    multiples: true,
    hashAlgorithm: 'md5',
    keepExtensions: true,
  },
  multipart: true,
};

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

// остальные роуты доступны только админу

router.post(
  '/',
  isAdmin,
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
  isAdmin,
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
  isAdmin,
  validator.objectId,
  validator.checkRelatedDocs,
  controller.delete,
);

router.post(
  '/upload',
  isAdmin, // подумай что делать с временным файлом если его отправит не админ
  koaBody(optional),
  validatorExcel.checkFile,
  validatorExcel.checkStructure,
  // excelReader.readFile, // without child process
  // controller.upload, // without child process
  controller.startChildProcess,
);

router.get(
  '/upload/state',
  isAdmin,
  controller.stateChildProcess,
);

router.get(
  '/upload/kill',
  isAdmin,
  controller.killChildProcess,
);

module.exports = router.routes();
