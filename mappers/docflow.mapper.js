module.exports = (data) => ({
  id: data.id,
  num: data.num,
  title: data.title,
  description: data.desc,
  directing: {
    id: data.directing._id,
    title: data.directing.title,
  },
  task: {
    id: data.task._id,
    title: data.task.title,
  },
  author: {
    uid: data.author._id,
    email: data.author.email,
    name: data.author.name,
    position: data.author.position,
  },
  files: data.files.map((f) => ({
    originalName: f.originalName,
    fileName: f.fileName,
  })),
  acceptor: data.acceptor.map((e) => ({
    uid: e.user._id,
    email: e.user.email,
    name: e.user.name,
    position: e.user.position,
    accept: e.accept,
  })),
  recipient: data.recipient.map((e) => ({
    uid: e.user._id,
    email: e.user.email,
    name: e.user.name,
    position: e.user.position,
    accept: e.accept,
  })),

  createdAt: data.createdAt,
  updatedAt: data.updatedAt,

  deadLine: data.deadLine,
  sum: data.sum,
});
