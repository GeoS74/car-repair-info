const mongoose = require('mongoose');
const connection = require('../libs/connection');

const Schema = new mongoose.Schema({
  carModel: {
    type: String,
    required: 'не заполнено обязательное поле {PATH}',
  },

  vin: {
    type: String,
    unique: 'Не уникальное значение {PATH}',
    required: 'не заполнено обязательное поле {PATH}',
  },
  stateNumber: {
    type: String,
    unique: 'Не уникальное значение {PATH}',
    required: 'не заполнено обязательное поле {PATH}',
  },
  place: String,
  yearProduction: String,
}, {
  timestamps: true,
});

Schema.index(
  {
    carModel: 'text',
    stateNumber: 'text',
  },
  {
    name: 'CarSearchIndex',
    default_language: 'russian',
  },
);

// подстрока ищется ИЛИ по индексу полнотекстового поиска
// ИЛИ по регулярному выражению по полю 'vin'
// это индекс нужен для возможности объединения полнотекстового поиска
// и поиска по регулярному выражению
Schema.index({ carModel: 1, vin: 1 });
Schema.index({ carModel: 1 }); // текстовый индекс для поиска по модели
Schema.index({ vin: 1 });
// CarSchema.index({ vin: 1 }); // уже есть уникальный индекс
// CarSchema.index({ stateNumber: 1 }); // уже есть уникальный индекс
// CarSchema.index({ 
//   carModel: 1,
//   vin: 1,
//   stateNumber: 1 
// }); // составной индекс

module.exports = connection.model('Car', Schema);
