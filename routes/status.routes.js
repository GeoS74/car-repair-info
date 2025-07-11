const Router = require('koa-router');

const controller = require('../controllers/status.controller');
// const accessCheck = require('../middleware/access.check');
// const isAdmin = require('../middleware/isAdmin');

const router = new Router({ prefix: '/api/informator/status' });

router.use(/* accessCheck,  isAdmin */);
router.get('/', controller.getAll);

module.exports = router.routes();
