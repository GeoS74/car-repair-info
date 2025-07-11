const XLSX = require('xlsx');
const fs = require('fs');
const logger = require('../libs/logger');
const Car = require('../models/Car');

const data = JSON.parse(process.env.data);

process.on('message', (message) => {
  if (message === 'kill') process.exit();
  if (message === 'uploadExcel') _uploadExcel();
});

async function _uploadExcel() {
  const rows = _readExcel();
  await _upload(rows);
  process.exit();
}

async function _upload(rows) {
  let arr = [];
  for (let i = 0; i < rows.length; i += 1) {
    arr.push({
      carModel: rows[i][data.structure.carModelField] || undefined,
      vin: rows[i][data.structure.vinField] || undefined,
      stateNumber: rows[i][data.structure.stateNumberField] || undefined,
      place: rows[i][data.structure.placeField] || undefined,
      yearProduction: rows[i][data.structure.yearProduction] || undefined,
    });

    if ((i + 1) % 10 === 0) {
      await _addManyCars(arr);
      arr = [];
    }
  }
  if (arr.length > 0) {
    await _addManyCars(arr);
  }
}

function _addManyCars(cars) {
  return Car.insertMany(cars, { ordered: false }); // пишет только строки у которых нет ошибок
}

function _readExcel() {
  const rows = _readExceltoArray(data.filePath, 0);
  _delTempFile(data.filePath);
  return _cutArray(rows, data?.startRow, data?.endRow);
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
