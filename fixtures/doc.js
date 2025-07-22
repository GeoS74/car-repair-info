const Doc = require('../models/Doc');
const Car = require('../models/Car');
const User = require('../models/User');
const logger = require('../libs/logger')

  ; (async _ => {
    const users = await getUsers();
    const cars = await getCars();
    const statuses = [10, 20, 30, 40, 50, 60, 70, 80];

    const arr = [];

    await clearDocs();

    for (let i = 0; i < 1000000; i++) {
      const user = users[random(0, users.length)];
      const car = cars[random(0, cars.length)];
      const status = statuses[random(0, statuses.length)];

      arr.push({
        title: `заявка ${i+1}`,
        directing: user.roles[0].directings[0].directing.id,
        task: user.roles[0].directings[0].tasks[0].task.id,
        author: user.id,
        statusCode: status,
        car: car.id,
      });

        if(arr.length === 50) {
          await insertDocs(arr);
          arr.length = 0;
          logger.info(`writed ${i + 1} rows`)
        }
    }

    if(arr.length) {
      await insertDocs(arr);
    }

    logger.info('~~ok~~');
    process.exit(0);
  })();

function random(min, max) { // случайное число от min до max
  let rand = min + Math.random() * (max - min);
  return Math.floor(rand);
}

function getUsers() {
  return User.find({})
    .populate({
      path: 'roles',
      populate: [
        { path: 'directings.directing' },
        { path: 'directings.tasks.task' },
        { path: 'directings.tasks.actions' },
      ],
    })
    .then(res => res.filter(e => e.roles[0].title !== 'Админ'));
}

function getCars() {
  return Car.find({});
}

function insertDocs(arr) {
  return Doc.insertMany(arr)
}

function clearDocs() {
  return Doc.deleteMany({})
}
