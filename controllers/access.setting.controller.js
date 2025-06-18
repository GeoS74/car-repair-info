const Role = require('../models/Role');
const User = require('../models/User');
const mapper = require('../mappers/access.setting.mapper');
const userMapper = require('../mappers/user.mapper');

module.exports.get = async (ctx) => {
  const settings = await _getAccessSettings();

  ctx.status = 200;
  ctx.body = mapper(settings);
};

module.exports.add = async (ctx) => {
  await _saveAccessSettings(ctx.request.body);

  ctx.status = 200;
  ctx.body = {
    message: 'saved access setting',
  };
};

module.exports.bundleRole = async (ctx) => {
  const user = await _updateBundleRoleToUser(ctx.request.body.email, ctx.request.body.roleId);

  if (!user) {
    ctx.throw(404, 'user not found');
  }

  // обновить название должности и fullName
  await user.setPosition().save();

  ctx.status = 200;
  ctx.body = userMapper(user);
};

function _updateBundleRoleToUser(email, roleId) {
  return User.findOneAndUpdate(
    { email },
    { roles: roleId ? [roleId] : [] },
    {
      new: true,
      runValidators: true, // запускает валидаторы схемы перед записью
    },
  ).populate('roles');
}

async function _getAccessSettings() {
  return Role.find({})
    .populate('directings.directing')
    .populate('directings.tasks.task')
    .populate('directings.tasks.actions');
}

async function _saveAccessSettings(roles) {
  if (!Object.keys(roles).length) {
    await Role.updateMany({}, { directings: [] });
    return;
  }

  for (const role in roles) {
    if ({}.hasOwnProperty.call(roles, role)) { // линтер хочет, чтобы ключи были перечисляемыми
      const directings = _getDirectings(roles[role]);

      await Role.findByIdAndUpdate(
        role.substring(3),
        { directings },
      );
    }
  }
}

/*
в зависимости от того сколько чекбоксов на клиенте включено,
сервер может получать следующие структуры:

~~~~~~направление активировано, задачи - нет~~~~~~~~
{
  id_role: { id_directing: [ 'on' ] }
}
~~~~~~направление активировано, задачи - тоже~~~~~~~~
{
  id_role: {
    id_directing: { '0': 'on', id_task: [Array] }
  }
}
*/

function _getDirectings(role) {
  const result = [];

  for (const idDirecting in role) {
    if (Object.keys(role[idDirecting]).length > 1) {
      result.push({
        directing: idDirecting.substring(3),

        tasks: _getTasks(role[idDirecting]),
      });
    }
  }
  return result;
}

function _getTasks(directing) {
  const result = [];

  for (const idTask in directing) {
    // проверка: задача активна или нет
    // если нет - состояния чекбоксов действий не сохраняются
    // активность - это наличие ключа '0' со значением 'on'
    if ({}.hasOwnProperty.call(directing[idTask], '0')) {
      if (idTask !== '0') { // игнорировать ключ '0'
        result.push({
          task: idTask.substring(3),

          actions: Object.keys(directing[idTask])
            .filter((a) => (a !== '0'))
            .map((a) => a.substring(3)),
        });
      }
    }
  }
  return result;
}
