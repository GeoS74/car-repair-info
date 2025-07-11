const Router = require('koa-router');
const { koaBody } = require('koa-body');

const controller = require('../controllers/directing.controller');
const validator = require('../middleware/validators/directing.params.validator');
const accessCheck = require('../middleware/access.check');
const isAdmin = require('../middleware/isAdmin');

const router = new Router({ prefix: '/api/informator/directing' });

router.use(accessCheck, isAdmin);
router.get('/:id', validator.objectId, controller.get);
router.get('/', controller.getAll);
router.post('/', koaBody({ multipart: true }), validator.title, controller.add);
router.patch('/:id', koaBody({ multipart: true }), validator.objectId, controller.update);
router.delete('/:id', validator.objectId, validator.checkRelatedDocs, controller.delete);

module.exports = router.routes();
