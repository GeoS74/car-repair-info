module.exports = (data) => ({
  id: data._id,
  comment: data.comment,

  author: {
    uid: data.author._id,
    email: data.author.email,
    name: data.author.name,
    position: data.author.position,
    photo: data.author.photo,
  },
  files: data.files.map((f) => ({
    originalName: f.originalName,
    fileName: f.fileName,
  })),

  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});
