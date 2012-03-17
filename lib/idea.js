
var prettyTitle = function (title) {
  return title
  // change everything to lowercase
  .toLowerCase() 
  // trim leading and trailing spaces
  .replace(/^\s+|\s+$/g, "") 
  // change all spaces and underscores to a hyphen
  .replace(/[_|\s]+/g, "-") 
  // remove all non-cyrillic, non-numeric characters except the hyphen
  .replace(/[^a-z\u0400-\u04FF0-9-]+/g, "") 
  // replace multiple instances of the hyphen with a single instance
  .replace(/[-]+/g, "-") 
  .replace(/^-+|-+$/g, "")
  // trim leading and trailing hyphens
  .replace(/[-]+/g, "-")
  .substr(0,20);
}

function Idea(idea){
  var newIdea = {
    _rev: idea._rev || null,
    _id: idea._id || null,
    name: idea.name || 'Untitled',
    url: prettyTitle(idea.name || 'Untitled'),
    description: idea.description || 'Without description',
    author: {
      name:(idea.author.name && idea.author.name !== '') ? idea.author.name : 'anon',
      password:idea.author.password ?idea.author.password : null ,
      from:(idea.author.from && idea.author.from !== '')?idea.author.from : 'invalid'
    },
    'created_at': idea['created_at'] || new Date(),
    up: idea.up || 0,
    down:idea.down || 0,
    room: '#'+(idea.room?idea.room.replace('#',''):idea.room) || '#nodester'
  };
  if (newIdea._rev === null) delete newIdea._rev
  if (newIdea._id === null) delete newIdea._id
  if (newIdea.author.password === null) delete newIdea.author.password
  return newIdea;
}

module.exports = Idea;