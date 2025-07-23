
/////////////////////////////////////// вариант для оптимизации запроса, разделение на 2 параллельных с ручным объединением //////////////////////////////////////////////////
const [docsResults, carsResults] = await Promise.all([
  // Запрос 1: Поиск по документам
  Docs.aggregate([
    {
      $match: { "title": { $regex: search, $options: "i" } }
    },
    {
      $lookup: {
        from: "cars",
        localField: "car",
        foreignField: "_id",
        as: "car"
      }
    },
    { $unwind: { path: "$car", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        doc: "$$ROOT",
        type: { $literal: "doc" }
      }
    },
    { $limit: limit }
  ]),

  // Запрос 2: Поиск по автомобилям
  Cars.aggregate([
    {
      $match: { "searchCombined": { $regex: search, $options: "i" } }
    },
    { $limit: limit },
    {
      $lookup: {
        from: "docs",
        localField: "_id",
        foreignField: "car",
        as: "doc"
      }
    },
    { $unwind: { path: "$doc", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: "$doc._id",
        doc: {
          $mergeObjects: [
            "$doc",
            { car: "$$ROOT" }
          ]
        },
        type: { $literal: "car" }
      }
    }
  ])
]);

// Дедупликация в приложении
const combinedResults = [...docsResults, ...carsResults]
  .reduce((acc, item) => {
    if (!acc.some(existing => existing._id.equals(item._id))) {
      acc.push(item);
    }
    return acc;
  }, [])
  .slice(0, limit); // Финальный лимит

















/////////////////////////////////////// простая, но медленная реализация поиска //////////////////////////////////////////////////
// slow worked
pipeline.push(
  {
    $lookup: {
      from: 'cars',
      localField: 'car',
      foreignField: '_id',
      as: 'car'
    }
  },
  { $unwind: '$car' },
);

pipeline.push({
  $match: {
    $or: [
      { 'title': { $regex: search, $options: 'i' } },
      { 'car.searchCombined': { $regex: search, $options: 'i' } },
    ]
  }
});
if (limit) {
  pipeline.push({ $limit: limit });
}







/////////////////////////////////////// имитация full outer join //////////////////////////////////////////////////
// slow worked
// имитация full outer join
pipeline.push(
  {
    $match: {
      "title": { $regex: search, $options: "i" }
    }
  },
  {
    $lookup: {
      from: "cars",
      localField: "car",
      foreignField: "_id",
      as: "car"
    }
  },
  { $unwind: { path: "$car", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 1,
      doc: "$$ROOT",
      type: { $literal: "doc" } // Помечаем документы из Doc
    }
  },
  { $limit: limit },

  // Этап 2: Поиск автомобилей с совпадениями (правая часть JOIN)
  {
    $unionWith: {
      coll: "cars",
      pipeline: [
        {
          $match: { "searchCombined": { $regex: search, $options: "i" } }
        },
        {
          $lookup: {
            from: "docs",
            localField: "_id",
            foreignField: "car",
            as: "doc"
          }
        },
        { $unwind: { path: "$doc", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: "$doc._id",
            doc: {
              $mergeObjects: [
                "$doc",
                { car: "$$ROOT" }
              ]
            },
            type: { $literal: "car" } // Помечаем документы из Car
          }
        }
      ]
    }
  },

  // Этап 3: Объединение и дедупликация
  {
    $group: {
      _id: "$_id",
      doc: { $first: "$doc" },
      types: { $addToSet: "$type" }
    }
  },
  {
    $replaceRoot: { newRoot: "$doc" }
  },
  { $limit: limit }
);










/////////////////////////////////////// просто пример кода, где в lookup используется pipeline //////////////////////////////////////////////////
// lookup с pipeline
{
  $lookup: {
    from: "cars",
      let: { carId: "$car" },
    pipeline: [
      {
        $match: {
          $expr: { $eq: ["$_id", "$$carId"] },
          $or: [
            { stateNumber: { $regex: search, $options: "i" } },
            { carModel: { $regex: search, $options: "i" } },
            { vin: { $regex: search, $options: "i" } }
          ]
        }
      },
      {
        $limit: limit
      }
    ],
      as: "car"
  },
},
// { $unwind: '$car' },
{
  $unwind: {
    path: "$car",
      preserveNullAndEmptyArrays: false // false удалит документ если это пустой массив, null или поля нет
  }
},