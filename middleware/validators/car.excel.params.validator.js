const fs = require('fs/promises');
const columnNameToNumber = require('../../libs/column.name.converter');
const logger = require('../../libs/logger');

module.exports.checkFile = async (ctx, next) => {
  if (!ctx.request.files) {
    ctx.throw(400, 'file not uploaded');
  }

  if (Object.keys(ctx.request.files).length > 1) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'more than one file received');
  }

  if (Object.keys(ctx.request.files).indexOf('carsListFile') === -1) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'field name "carsListFile" is empty');
  }

  if (Array.isArray(ctx.request.files.carsListFile)) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'more than 1 file received by field "carsListFile"');
  }
 
  if (!_checkMimeType(ctx.request.files.carsListFile.mimetype)) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'file must be in excel format');
  }

  await next();
};

function _checkMimeType(mimeType) {
  switch (mimeType) {
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return true;
    default:
      return false;
  }
}

function _deleteFile(files) {
  if (files) {
    for (const file of Object.values(files)) {
      // received more than 1 file in any field with the same name
      if (Array.isArray(file)) {
        _deleteFile(file);
      } else {
        logger.info('ok')
        fs.unlink(file.filepath)
          .catch((error) => logger.error(error.mesasge));
      }
    }
  }
}

module.exports.checkStructure = async (ctx, next) => {
  ctx.structure = _getStructure(ctx.request.body);

  if (ctx.structure.carModelField === null) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'carModelField is empty');
  }
  if (ctx.structure.vinField === null) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'vinField is empty');
  }
  if (ctx.structure.stateNumberField === null) {
    _deleteFile(ctx.request.files);
    ctx.throw(400, 'stateNumberField is empty');
  }

  await next();
};

function _getStructure(body) {
  return {
    carModelField: _getColumnNumber(body?.carModelField),
    vinField: _getColumnNumber(body?.vinField),
    stateNumberField: _getColumnNumber(body?.stateNumberField),
    placeField: _getColumnNumber(body?.placeField),
    yearProductionField: _getColumnNumber(body?.yearProductionField),
  };
}

function _getColumnNumber(name) {
  const columnNumber = parseInt(name, 10) || columnNameToNumber(name);
  return columnNumber ? columnNumber - 1 : null;
}
