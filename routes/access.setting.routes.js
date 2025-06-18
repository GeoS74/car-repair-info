const Router = require('koa-router');
const { koaBody } = require('koa-body');

const controller = require('../controllers/access.setting.controller');
const validator = require('../middleware/validators/access.setting.params.validator');
const accessCheck = require('../middleware/access.check');

const router = new Router({ prefix: '/api/informator/setting/access' });

router.use(accessCheck);
router.get('/', controller.get);
router.post('/', koaBody({ multipart: true }), /* check ObjectId for validity */ controller.add);

// привязка роли к пользователю
router.patch(
  '/bundle/role',
  koaBody({ multipart: true }),
  validator.roleId,
  validator.email,
  controller.bundleRole,
);

module.exports = router.routes();
