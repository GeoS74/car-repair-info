const { readdir, mkdir } = require('node:fs/promises');
const Router = require('koa-router');
const { koaBody } = require('koa-body');
const serve = require('koa-static');
const mount = require('koa-mount');

const controller = require('../controllers/user.controller');
const validator = require('../middleware/validators/user.params.validator');
const validatorSearch = require('../middleware/validators/search.params.validator');
const accessCheck = require('../middleware/access.check');
const isAdmin = require('../middleware/isAdmin');

(async () => {
  try {
    await readdir('./files/photo');
  } catch (error) {
    mkdir('./files/photo', {
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

const router = new Router({ prefix: '/api/informator/user' });

/*
* все роуты доступны только при наличии access токена
* CRUD операции выполняются по email-у, передаваемом в access токене
* если проверка access токена выключена, срабатывает валидатор email
*/

router.use(accessCheck, validator.email);

// эти роуты для управления пользователями из админки
router.get(
  '/search',
  isAdmin,
  validatorSearch.searchString,
  validatorSearch.lastId,
  validatorSearch.limit,
  validatorSearch.directingId,
  validatorSearch.tascId,

  controller.search,
);
router.get('/management/:id',
  isAdmin,
  validator.objectId,
  controller.getById
);
router.post('/management', 
  isAdmin,
  koaBody({ multipart: true }), 
  validator.checkBodyParams,
  controller.add
);
router.patch('/management',
  isAdmin,
  koaBody({ multipart: true }),
  validator.checkBodyParams,
  controller.update
);

// router.get('/all', /* добавить сюда проверку на админа */ controller.getAll);

// эти роуты используют Access token
router.get('/', 
  controller.get
);
router.post('/', 
  koaBody({ multipart: true }), 
  validator.params, 
  controller.add
);
router.patch('/', 
  koaBody({ multipart: true }), 
  validator.params, 
  controller.update
);
// router.delete('/', controller.delete); // user не должен сам себя удалять

router.patch('/photo', 
  koaBody(optional), 
  validator.photo, 
  controller.photo
);

module.exports.routes = router.routes();

// static files
module.exports.static = mount('/api/informator/user/photo', serve('./files/photo'));
