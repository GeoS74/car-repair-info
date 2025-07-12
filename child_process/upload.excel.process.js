const XLSX = require('xlsx');
const fs = require('fs');
const logger = require('../libs/logger');
const Car = require('../models/Car');

const data = JSON.parse(process.env.data);

let state = 'процесс запущен';

process.on('message', (message) => {
  switch (message) {
    case 'uploadExcel':
      _uploadExcel();
      break;

    case 'state':
      process.send(state);
      break;
    case 'kill':
      process.exit();
      break;
    default:
      process.send('unknown bot command');
  }
});

async function _uploadExcel() {
  state = 'загрузка файла началась';

  const rows = _readExcel();
  await _upload(rows);

  state = 'загрузка файла завершена';

  process.exit();
}

// function delay(ms) {
//   return new Promise((res) => {
//     setTimeout(() => {
//       res();
//     }, ms);
//   });
// }

async function _upload(rows) {
  let arr = [];
  for (let i = 0; i < rows.length; i += 1) {
    // await delay(150); // for test

    state = `обработано ${i + 1} из ${rows.length}`;

    arr.push({
      carModel: rows[i][data.structure.carModelField] || undefined,
      vin: rows[i][data.structure.vinField] || undefined,
      stateNumber: rows[i][data.structure.stateNumberField] || undefined,
      place: rows[i][data.structure.placeField] || undefined,
      yearProduction: rows[i][data.structure.yearProduction] || undefined,
    });

    if ((i + 1) % 5 === 0) {
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
