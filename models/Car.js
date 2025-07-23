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

  searchCombined: String,
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

/**
 * создание и обновление поля searchCombined для оптимизации поиска
 */
Schema.pre('save', setSearchCombined);

function setSearchCombined() {
  this.searchCombined = `${this.carModel} ${this.vin} ${this.stateNumber}`;
}

// подстрока ищется ИЛИ по индексу полнотекстового поиска
// ИЛИ по регулярному выражению по полю 'vin'
// этот индекс нужен для возможности объединения полнотекстового поиска
// и поиска по регулярному выражению
Schema.index({ vin: 1 });
Schema.index({ stateNumber: 1, carModel: 1, vin: 1 }, { collation: { locale: 'en', strength: 2 } });
Schema.index({ stateNumber: 1 });
Schema.index({ carModel: 1 });
Schema.index({ searchCombined: 1 });

module.exports = connection.model('Car', Schema);
