const Router = require('koa-router');
const { koaBody } = require('koa-body');

const controller = require('../controllers/company.controller');
const validator = require('../middleware/validators/company.params.validator');
const accessCheck = require('../middleware/access.check');
const isAdmin = require('../middleware/isAdmin');

const router = new Router({ prefix: '/api/informator/company' });

router.use(accessCheck, isAdmin);
router.get('/:id', validator.objectId, controller.get);
router.get('/', controller.getAll);
router.post('/', koaBody({ multipart: true }), validator.title, controller.add);
router.patch('/:id', koaBody({ multipart: true }), validator.objectId, controller.update);
router.delete('/:id', validator.objectId, validator.checkRelatedUsers, controller.delete);

module.exports = router.routes();
