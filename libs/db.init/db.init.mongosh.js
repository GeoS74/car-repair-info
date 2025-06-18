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
  { title: 'Согласование', code: 30 },
  { title: 'Согласовано механиком', code: 40 },
  { title: 'Ремонт завершен', code: 50 },
  { title: 'Согласовано заказчиком', code: 60 },
  { title: 'Выложено в ЭДО', code: 70 },
  { title: 'Подписано в ЭДО', code: 80 },
  { title: 'Оплачено', code: 90 },
]);