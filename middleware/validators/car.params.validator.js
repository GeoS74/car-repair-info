const { isValidObjectId } = require('mongoose');
const transliteToEng = require('../../libs/translitter');

module.exports.carModel = async (ctx, next) => {
  const carModel = _checkText(ctx.request?.body?.carModel);
  if (!carModel) {
    ctx.throw(400, 'invalid car model');
  }

  ctx.request.body.carModel = carModel;

  await next();
};

module.exports.vin = async (ctx, next) => {
  const vin = _checkVIN(ctx.request?.body?.vin);
  if (!vin) {
    ctx.throw(400, 'invalid vin code');
  }

  ctx.request.body.vin = transliteToEng(vin).toUpperCase();

  await next();
};

module.exports.stateNumber = async (ctx, next) => {
  const stateNumber = _checkText(ctx.request?.body?.stateNumber);
  if (!stateNumber) {
    ctx.throw(400, 'invalid state number');
  }

  ctx.request.body.stateNumber = stateNumber;

  await next();
};

module.exports.place = async (ctx, next) => {
  ctx.request.body.place = _checkText(ctx.request?.body?.place);
  await next();
};

module.exports.yearProduction = async (ctx, next) => {
  ctx.request.body.yearProduction = _checkText(ctx.request?.body?.yearProduction);
  await next();
};

module.exports.objectId = async (ctx, next) => {
  if (!_checkObjectId(ctx.params.id)) {
    ctx.throw(400, 'invalid car id');
  }

  await next();
};

function _checkObjectId(id) {
  return isValidObjectId(id);
}

function _checkVIN(vinCode) {
  const vin = vinCode?.trim();

  if (vin?.length === 17) return vin;

  return false;
}

function _checkText(text) {
  return text?.trim();
}
