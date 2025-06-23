const Router = require('koa-router');
// const { koaBody } = require('koa-body');

const controller = require('../controllers/status.controller');
const accessCheck = require('../middleware/access.check');

const router = new Router({ prefix: '/api/informator/status' });

router.use(accessCheck);
router.get('/', controller.getAll);

module.exports = router.routes();
