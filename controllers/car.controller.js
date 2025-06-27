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
