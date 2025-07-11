const XLSX = require('xlsx');
const fs = require('fs');
const logger = require('../libs/logger');

module.exports.file = async function (ctx, next) {
  ctx.rows = _readExceltoArray(ctx.request.files.carsListFile.filepath, 0);
  _delTempFile(ctx.request.files.carsListFile.filepath);
  ctx.rows = _cutArray(ctx.rows, ctx.request.body?.startRow, ctx.request.body?.endRow);

  await next();
}

function _readExceltoArray(filePath, numSheet) {
  let workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[numSheet || 0];
  let worksheet = workbook.Sheets[sheetName];
  const opts = {
    header: 1,
    defval: '',
  };

  // отвязать контекст, это высвобождет примерно 30-35 Мб сразу
  const result = [...XLSX.utils.sheet_to_json(worksheet, opts)];
  workbook = null;
  worksheet = null;
  return result;
}

function _cutArray(arr, startRow, endRow) {
  startRow = parseInt(startRow, 10) || 1;
  endRow = parseInt(endRow, 10) || 0;
  return endRow ? arr.slice(startRow - 1, endRow) : arr.slice(startRow - 1);
}

function _delTempFile(filepath) {
  fs.unlink(filepath, (err) => {
    if (err) logger.error(err);
  });
}