function Idea(idea){

  var newIdea = {
    _rev: idea._rev || null,
    _id: idea._id || null,
    name: idea.name || 'Untitled',
    description: idea.description || 'Without description',
    author: {
      name:idea.author.name || 'anon',
      from:idea.author.from || 'site'
    },
    'created_at': idea['created_at'] || new Date(),
    up: idea.up || 0,
    down:idea.down || 0,
    room: idea.room || '#nodester'
  };
  if (newIdea._rev === null) delete newIdea._rev
  if (newIdea._id === null) delete newIdea._id
  return newIdea;
}

module.exports = Idea;