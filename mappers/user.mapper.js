module.exports = (data) => ({
  uid: data._id,
  email: data.email,
  photo: data.photo || '',
  name: data.name || '',
  position: data.position || '',

  roles: data.roles.map((role) => ({
    id: role.id,
    title: role.title,

    directings: role.directings.map((d) => ({
      id: d.directing.id,
      title: d.directing.title,

      tasks: d.tasks.map((t) => ({
        id: t.task.id,
        title: t.task.title,

        actions: t.actions.map((a) => ({
          id: a.id,
          title: a.title,
        })),
      })),
    })),
  })),
});
