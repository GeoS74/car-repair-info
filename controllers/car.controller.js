const childProcess = require('child_process');

const Car = require('../models/Car');
const mapper = require('../mappers/car.mapper');

module.exports.get = async (ctx) => {
  const car = await _getCar(ctx.params.id);

  if (!car) {
    ctx.throw(404, 'car not found');
  }
  ctx.status = 200;
  ctx.body = mapper(car);
};

module.exports.search = async (ctx) => {
  const data = _makeFilterRules({
    ...ctx.query,
  });

  const cars = await _searchCars(data);

  ctx.body = cars.map((car) => (mapper(car)));
  ctx.status = 200;
};

module.exports.add = async (ctx) => {
  const car = await _addCar({ ...ctx.request.body });
  ctx.status = 201;
  ctx.body = mapper(car);
};

module.exports.update = async (ctx) => {
  const car = await _updateCar(ctx.params.id, ctx.request.body);

  if (!car) {
    ctx.throw(404, 'car not found');
  }
  ctx.status = 200;
  ctx.body = mapper(car);
};

module.exports.delete = async (ctx) => {
  const car = await _deleteCar(ctx.params.id);

  if (!car) {
    ctx.throw(404, 'car not found');
  }

  ctx.status = 200;
  ctx.body = mapper(car);
};

function _getCar(id) {
  return Car.findById(id);
}

function _addCar({
  carModel,
  vin,
  stateNumber,
  place,
  yearProduction,
}) {
  return Car.create({
    carModel,
    vin,
    stateNumber,
    place,
    yearProduction,
  });
}

function _updateCar(id, {
  carModel,
  vin,
  stateNumber,
  place,
  yearProduction,
}) {
  return Car.findByIdAndUpdate(
    id,
    {
      carModel,
      vin,
      stateNumber,
      place,
      yearProduction,
    },
    {
      runValidators: true, // запускает валидаторы схемы перед записью
      new: true,
    },
  );
}

function _deleteCar(id) {
  return Car.findByIdAndDelete(id);
}

async function _searchCars(data) {
  return Car.find(data.filter, data.projection)
    .sort({
      _id: -1,
      //  score: { $meta: "textScore" } //сортировка по релевантности
    })
    .limit(data.limit);
}

function _makeFilterRules({
  search,
  lastId,
  limit,
}) {
  const filter = {};
  const projection = {};

  if (search) {
    filter.$or = [
      { vin: { $regex: search, $options: 'i' } },
      { $text: { $search: search, $language: 'russian' } },

    ];

    projection.score = { $meta: 'textScore' }; // добавить в данные оценку текстового поиска (релевантность)
  }

  if (lastId) {
    filter._id = { $lt: lastId };
  }

  return { filter, projection, limit };
}

module.exports.upload = async (ctx) => {
  let arr = [];
  for (let i = 0; i < ctx.rows.length; i += 1) {
    arr.push({
      carModel: ctx.rows[i][ctx.structure.carModelField] || undefined,
      vin: ctx.rows[i][ctx.structure.vinField] || undefined,
      stateNumber: ctx.rows[i][ctx.structure.stateNumberField] || undefined,
      place: ctx.rows[i][ctx.structure.placeField] || undefined,
      yearProduction: ctx.rows[i][ctx.structure.yearProduction] || undefined,
    });

    if ((i + 1) % 10 === 0) {
      await _addManyCars(arr);
      arr = [];
    }
  }
  if (arr.length > 0) {
    await _addManyCars(arr);
  }

  ctx.status = 200;
};

function _addManyCars(cars) {
  return Car.insertMany(cars, { ordered: false }); // пишет только строки у которых нет ошибок
}

let bot;

module.exports.startChildProcess = async (ctx) => {
  if (!bot) {
    bot = childProcess.fork(
      './child_process/upload.excel.process',
      {
        env: {
          data: JSON.stringify({
            structure: ctx.structure,
            filePath: ctx.request.files.carsListFile.filepath,
            startRow: ctx.request.body?.startRow,
            endRow: ctx.request.body?.endRow,
          }),
        },
      },
    );

    bot.command = (commandBot) => new Promise((res) => {
      bot.once('message', (message) => res(message));
      bot.send(commandBot);
    });

    bot.command('uploadExcel');
  }
  // await next();
  ctx.status = 200;
};

module.exports.killChildProcess = async (ctx) => {
  if (bot) {
    bot.send('kill');
    bot = null;
  }
  ctx.status = 200;
};
