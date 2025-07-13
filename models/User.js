// модель коллекции пользователей
//
const mongoose = require('mongoose');
const connection = require('../libs/connection');
const Role = require('./Role');
const Company = require('./Company');

const Schema = new mongoose.Schema({
  email: {
    type: String,
    required: 'не заполнено обязательное поле {PATH}',
    unique: 'Не уникальное значение {PATH}',
  },
  roles: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: Role,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Company,
  },
  name: String,
  photo: String,
  fullName: String,
  position: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

/**
 * создание и обновление поля fullName пользователя
 */
Schema.pre('save', setFullName);

function setFullName() {
  this.fullName = getFullName.call(this);
}

function getFullName() {
  return (`${this.name || ''} ${this.email} ${this.position || ''}`).trim();
}

Schema.methods.setPosition = function sp() {
  this.position = this.roles[0]?.title;
  return this;
};

// раскоммениируй этот индекс если поиск регуляркой будет работать медленно
// Schema.index({ email: 1 });

module.exports = connection.model('User', Schema);

// справочно: пример использования middleware для 'findOneAndUpdate'
//
// Schema.pre('findOneAndUpdate', updateFullName);
// function updateFullName() {
//   const email = this.getFilter()?.email;
//   const name = this.getUpdate()?.name;

//   this.setUpdate({
//     fullName: getFullName.call({ email, name }),
//     ...this.getUpdate(),
//   });
// }
