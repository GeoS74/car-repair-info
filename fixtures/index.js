const fs = require('fs/promises');
const Directing = require('../models/Directing');
const Task = require('../models/Task');
const Doc = require('../models/Doc');
const User = require('../models/User');
const logger = require('../libs/logger')

; (async _ => {
  const woble = await getWoble();
  const directings = await getDirectings();
  const tasks = await getTasks();
  const authors = await getUsers();
  const arr = [];

  for (let i = 0; i < 5000000; i++) {
    const randomText = woble[getRandomInt(woble.length)];
    arr.push({
      title: randomText.title,
      desc: randomText.text,
      directing: directings[getRandomInt(directings.length)],
      task: tasks[getRandomInt(tasks.length)],
      author: authors[getRandomInt(authors.length)],
    })

    if(arr.length === 50) {
      await insertDocs(arr);
      arr.length = 0;
      logger.info(`writed ${i + 1} rows`)
    }
  }

  if(arr.length) {
    await insertDocs(arr);
  }

  logger.info('~~ok~~')
})();


function insertDocs(arr){
  return Doc.insertMany(arr)
}

function getUsers() {
  return User.find({})
    .then(res => res.map(e => e.id));
}

function getDirectings() {
  return Directing.find({})
    .then(res => res.map(e => e.id));
}

function getTasks() {
  return Task.find({})
    .then(res => res.map(e => e.id));
}

// получить массив из текста с разбивкой по переносу строки
function getWoble() {
  return fs.readFile('./woble.txt', { encoding: 'utf8' })
    .then(res => res.split("\r\n")
      .filter(v => !!v)
      .map(e => ({
        title: e.slice(0, e.indexOf('.')),
        text: e,
      }))
    );
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}