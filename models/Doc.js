const mongoose = require('mongoose');
const connection = require('../libs/connection');
const Directing = require('./Directing');
const Task = require('./Task');
const User = require('./User');
const Car = require('./Car');

const Signatory = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    index: true,
  },
  accept: Boolean,
}, {
  timestamps: true,
});

const Schema = new mongoose.Schema({
  num: Number, // идентификатор в рамках документов одного типа и направления
  acceptor: {
    type: [Signatory],
    // index: true, // если указать так, то индекс не создаётся
  },
  recipient: [Signatory],
  title: {
    type: String,
    required: 'не заполнено обязательное поле {PATH}',
  },
  desc: {
    type: String,
  },
  directing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Directing,
    required: 'не заполнено обязательное поле {PATH}',
    // index: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Task,
    required: 'не заполнено обязательное поле {PATH}',
    // index: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    required: 'не заполнено обязательное поле {PATH}',
  },
  files: [{ originalName: String, fileName: String }],

  // поля для документа типа: Счёт
  deadLine: Date,
  sum: Number,

  // поля для документа тапи: Заказ-наряд
  statusCode: Number,
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Car,
  },
  mileage: String,
}, {
  timestamps: true,
});

Schema.index(
  {
    title: 'text',
  },
  {
    name: 'ActionSearchIndex',
    default_language: 'russian',
  },
);

// генерация идентификатора в рамках документов одного типа и направления
Schema.pre('save', async function _(next) {
  const lastDoc = await module.exports.findOne({
    directing: this.directing,
    task: this.task,
  })
    .sort({ _id: -1 });

  this.num = (lastDoc?.num || 0) + 1;

  next();
});

Schema.index({ statusCode: 1, directing: 1, task: 1 }); // уже есть
Schema.index({ directing: 1, task: 1 }); // уже есть
Schema.index({ directing: 1 }); // уже есть
Schema.index({ task: 1 }); // уже есть
Schema.index({ statusCode: 1 }); // уже есть
Schema.index({ author: 1 }); // уже есть
Schema.index({ title: 1 }); // уже есть
Schema.index({ car: 1 }); // индекс для поиска по автомобилю
// DocSchema.index({ createdAt: -1 }); // для сортировки по дате создания

module.exports = connection.model('Doc', Schema);
