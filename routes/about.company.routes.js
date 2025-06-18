const Router = require('koa-router');
const { koaBody } = require('koa-body');

const controller = require('../controllers/about.company.controller');
const validator = require('../middleware/validators/about.params.validator');
const accessCheck = require('../middleware/access.check');

const router = new Router({ prefix: '/api/informator/about' });

router.get('/:alias', controller.get);
router.get('/', accessCheck, controller.getAll);
router.post('/', accessCheck, koaBody({ multipart: true }), validator.params, controller.add);
router.patch('/:alias', accessCheck, koaBody({ multipart: true }), controller.update);
router.delete('/:alias', accessCheck, controller.delete);

module.exports = router.routes();
