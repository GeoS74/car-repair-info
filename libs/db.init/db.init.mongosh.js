db.actions.insertMany([
  { title: 'Создать' },
  { title: 'Редактировать' },
  { title: 'Удалить' },
  { title: 'Согласовать' },
  { title: 'Ознакомиться' },
  { title: 'Изменять статусы' },
]);

db.status.insertMany([
  { title: 'Новая заявка', code: 10 },
  { title: 'В работе', code: 20 },
  { title: 'На согласовании механика', code: 30 },
  { title: 'Согласовано механиком', code: 40 },
  { title: 'Согласовано заказчиком', code: 50 },
]);