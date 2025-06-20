const { readdir, mkdir } = require('node:fs/promises');
const Router = require('koa-router');
const { koaBody } = require('koa-body');

const controller = require('../controllers/doccomment.controller');
const validator = require('../middleware/validators/doccomment.params.validator');
const accessCheck = require('../middleware/access.check');

(async () => {
  try {
    await readdir('./files/scan');
  } catch (error) {
    mkdir('./files/scan', {
      recursive: true,
    });
  }
})();

const optional = {
  formidable: {
    uploadDir: './files',
    allowEmptyFiles: false,
    minFileSize: 1,
    multiples: true,
    hashAlgorithm: 'md5',
    keepExtensions: true,
  },
  multipart: true,
};

const router = new Router({ prefix: '/api/informator/doccomments' });

/**
 * все роуты доступны только при наличии access токена
 * после проверки access токена в массив ctx.accessDocTypes
 * записываются все пары (напр./тип док-та)
 *
 *
 */

router.use(
  accessCheck,
  validator.email,
  controller.getMe,
);

router.get(
  '/search',
  validator.objectIdByQuery,
  controller.search,
);

router.post(
  '/',
  koaBody(optional),
  validator.comment,
  validator.objectIdByBody,
  validator.checkParentDoc,

  controller.add,
);

module.exports.routes = router.routes();

// static files
// этот роут не нужен, т.к. директория для хранения файлов из комментариев и файлов документов
// одна и та же. Этот статический роут доступен из doc.flow.routes
// module.exports.static = mount('/api/informator/docflow/scan', serve('./files/scan'));
