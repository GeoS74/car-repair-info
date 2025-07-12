const Koa = require('koa');
const cors = require('@koa/cors');

const config = require('./config');
const errorCatcher = require('./middleware/error.catcher');
const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const directingRoutes = require('./routes/directing.routes');
const taskRoutes = require('./routes/task.routes');
const actionRoutes = require('./routes/action.routes');
const statusRoutes = require('./routes/status.routes');
const accessSettingRoutes = require('./routes/access.setting.routes');
const docFlowRoutes = require('./routes/doc.flow.routes');
const docCommentsRoutes = require('./routes/doc.comments.routes');
const carsRoutes = require('./routes/cars.routes');
const companyRoutes = require('./routes/company.routes');

const app = new Koa();

app.use(errorCatcher);
if (config.node.env === 'dev') {
  app.use(cors());
}

app.use(userRoutes.routes); // ...test dev
app.use(userRoutes.static); // no test
app.use(roleRoutes); // test ok
app.use(directingRoutes); // test ok
app.use(taskRoutes); // test ok
app.use(actionRoutes); // test ok
app.use(statusRoutes); // test ok
app.use(accessSettingRoutes); // ...test dev
app.use(docFlowRoutes.routes);
app.use(docFlowRoutes.static); // no test
app.use(docCommentsRoutes.routes);
app.use(carsRoutes);
app.use(companyRoutes); // test ok

module.exports = app;
