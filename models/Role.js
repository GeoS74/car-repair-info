const mongoose = require('mongoose');
const connection = require('../libs/connection');
const Directing = require('./Directing');
const Task = require('./Task');
const Action = require('./Action');

const TaskToActions = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Task,
  },
  actions: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: Action,
  },
});

const DirectingToTasks = new mongoose.Schema({
  directing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Directing,
  },

  tasks: [TaskToActions],
});

const Schema = new mongoose.Schema({
  title: {
    type: String,
    unique: 'Не уникальное значение {PATH}',
  },
  directings: [DirectingToTasks],
}, {
  timestamps: true,
});

Schema.index(
  {
    title: 'text',
  },
  {
    name: 'RoleSearchIndex',
    default_language: 'russian',
  },
);

module.exports = connection.model('Role', Schema);
