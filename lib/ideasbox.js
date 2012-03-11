#!/usr/bin/env node

/*
 * ideasbox
 * @date:Thu Mar 08 2012 21:25:59 GMT-0600 (CST)
 * @name: ideasbox.js
 * @licence: MIT
*/


var http    = require('http')
  , tako    = require('tako')
  , request = require('request')
  , config  = require('./config')
  , nano    = require('nano')(config.bd)
  , db      = nano.use('ideas')
  , app     = tako()
  , path    = require('path')
  , jade    = require('jade')
  , fs      = require('fs')
  , Idea    = require('./idea')
  , qs      = require('querystring')
  ;

function JadeCompiler(home,globals){
  this.HOME   = path.join(home);
  this.layout = path.join(this.HOME, globals.layout || 'layout.jade');
  this.GLOBAL = globals;
}
JadeCompiler.prototype.render = function(file, locals){
  if (path.extname(file) === '') file += '.jade'
  if (path.extname(file) === '.jade') {
    var layout  = locals.layout ? path.join(this.HOME,locals.layout) : this.layout
      , _layout = fs.readFileSync(layout,'utf8')
      , _file   = fs.readFileSync(path.join(this.HOME, file), 'utf8')
      , page    = jade.compile(_file , { pretty : true })
      ;
    // At the end GLOBAL is not that "GLOBAL" as we want 
    for (var i in locals){
      this.GLOBAL[i] = locals[i]
    }
    page = page(this.GLOBAL);
    this.GLOBAL['body'] = page;
    var pageRenderized = jade.compile(_layout , { pretty : true });
    pageRenderized = pageRenderized(this.GLOBAL);
    return pageRenderized
  } else {
    return new Error('Invalid Extension Name: ' + path.extname(file))
  }
}
var views = new JadeCompiler(path.join(__dirname,'..','views'),{
  sitename:'ideasBox',
  author:'Alejandro Morales'
});

// Static Provider
app.route('/assets/*').files(path.join(__dirname,'..','public'));

app.route('/').html(function(req,res){
  res.end(views.render('index',{
     name:'alejandromg'
   }))
}).methods('GET')

app.route('/favicon.ico', function(req,res){
  res.redirect('/assets/logo.png')
})

app.route('/home',function(req,res){
  res.redirect('/assets/images/misc/input-bg-outset.png')
})
app.route('/404', function(req,res){
  res.statusCode = 404;
  res.end('NOT_FOUND')
});
app.route('/:room', function(req,res){
  var room = req.route.params.room;
      room = '#'+room
      room = escape(room)
  {"/_design/sort/_view/channel"}
  db.view('sort','channel',{key:unescape(room)},function(e,d){
     if (!e && d.rows.length > 0 ) {
       res.end(views.render('page', {
           ideas : d.rows
         , room  : req.route.params.room
       }));
     } else {
       res.redirect('/404');
     }
  });
}).methods('GET')

app.route('/:room/new', function(req,res){
  req.on('data',function(da){
    var data = new Buffer(da)
        data = qs.parse(data.toString('utf8'));
    for (var member in data){
      if (member.search('\\[') != -1){
        var key = member.split('[');
        data[key[0]] = data[key[0]]||{}
        data[key[0]][key[1].replace(']','')] = data[member]
        delete data[member]
      }
    }
    var user = {
        name  : data.author.name
      , from  : data.author.from
      , email : data.author.email
    }
    var idea = {
        name        : data.name
      , description : data.description
      , author      : user
      , room        : data.room
    }
    var doc = new Idea(idea);
    //based on default data not the doc, validation
    if (data.name.trim() ==='' && data.description.trim()===''){
      res.end({
          statusCode:422
        , info: 'Invalid Data'
        , msg: 'The data is incorrect or invalid'
      })
    } else {
      db.view('sort','post',{key:[doc.name,'#'+doc.room]},function(e,d){
        if (!e && d.rows.length > 0) {
          res.statusCode = 422;
          res.end({
              statusCode : 422
            , info       : 'Identity not valid'
            , msg        : doc.name+': already exists.'
          })
        } else if (e){
          res.end({
            statusCode:500
          })
        } else {
          db.insert(doc,function(e,d){
            var statusCode = 500
              , url        ='/';
            if (!e) {
              statusCode = 200
              url        = '/'+doc.room.replace('#','')+'/'+doc.url
            } 
            res.end({
                statusCode : statusCode
              , url        : '/'+doc.room.replace('#','')+'/'+doc.url
            })
          })
        }
      });
    }
  })
}).methods('POST');
app.route('/:room/:idea', function(req,res){
  with (req.route.params) {
    db.view('sort','url',{ key : [idea, '#'+room] , limit:1 }, function(e,d){
      if (!e && d.rows.length > 0){
        res.end(views.render('single',{
            room : room
          , idea : d.rows[0].value
        }))
      } else {
        res.redirect('/404')
      }
    });
  }
}).methods('GET')

var idea = {
    name:'Prueba con rinocerontes'
  , description:'Prueba con rinocerontes\n debe de estar prohibido ya que es inmoral y padece de interes particular de las personas por mejroar lo que se tiene.\nPrueba con rinocerontes\n debe de estar prohibido ya que es inmoral y padece de interes particular de las personas por mejroar lo que se tiene.  '
  , author:{
       name:'Alejandro Morales'
     , from:'ideasBox'
     , email:'vamg008@gmail.com'
    }
  , room:'ideasBox'
}
/*db.insert(new Idea(idea), function(e,d){
  console.log(e,d)
})*/




app.sockets.on('connection', function (socket) {
  app.sockets.emit('news', { will: 'be received by everyone'});
  socket.on('disconnect', function () {
    app.sockets.emit('user disconnected')
  })
})
function run(port) {
  port = port || 8000;
  app.httpServer.listen(port, function() {
    console.log('running on port: '+port);
  });
};
module.exports.run = run;
