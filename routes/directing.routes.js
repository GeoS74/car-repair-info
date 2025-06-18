const Router = require('koa-router');
const { koaBody } = require('koa-body');

const controller = require('../controllers/directing.controller');
const validator = require('../middleware/validators/directing.params.validator');
const accessCheck = require('../middleware/access.check');

const router = new Router({ prefix: '/api/informator/directing' });

router.use(accessCheck);
router.get('/:id', validator.objectId, controller.get);
router.get('/', controller.getAll);
router.post('/', koaBody({ multipart: true }), validator.title, controller.add);
router.patch('/:id', koaBody({ multipart: true }), validator.objectId, controller.update);
router.delete('/:id', validator.objectId, controller.delete);

module.exports = router.routes();
