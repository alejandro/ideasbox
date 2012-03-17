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
  , url     = require('url')
  , Emitter  = require('eventemitter2').EventEmitter2;
  
var iB = new Emitter({
  namespace: 'ideasBox',
  delimiter: '::',
  maxListeners: 20,
  wildcard:  '*'
});

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
  iB.emit('stats::home',req);
  res.end(fs.readFileSync(__dirname+'/../public/untitled.html', 'utf8'))
}).methods('GET')

app.route('/favicon.ico', function(req,res){
  res.redirect('/assets/logo.png')
})
iB.on('stats::*',function(data){
  console.log(data.url)
})
iB.on('ideas::*',function(idea){
  
});
app.route('/home',function(req,res){
  res.redirect('/assets/images/misc/input-bg-outset.png')
})
app.route('/404', function(req,res){
  
  req.query= qs.parse(req.query)
  res.statusCode = 404;
  res.end(views.render('error',{
      code    : 404
    , info    : 'Page doesn\'t exists'
    , referer : unescape(req.query.ref)
  }))
});
app.route('/500', function(req,res){
  res.statusCode = 500;
  res.end(views.render('error',{
      code : 500
    , info : 'Internal Server Error'
  }))
})

var queryfied = function (data){
  data = new Buffer(data);
  data = qs.parse(data.toString('utf8'));
  var original = Object.create(data)
  for (var member in data){
    if (member.search('\\[') != -1){
      var key = member.split('[');
      data[key[0]] = data[key[0]]||{}
      data[key[0]][key[1].replace(']','')] = data[member]
      delete data[member]
    } else {
    }
  }
  data.name = original.name
  return data;
};

var saveRoom = function(req,res,data){
  data.user ? data.author = data.user : true;
  data = new Idea(data);
  data.channel = true;
  var room = data.room = '#'+req.route.params.room;
  var referer = url.parse(req.headers.referer)
  db.view('sort','channel',{key:unescape(room)},function(e,d){
    if (!e && d.rows.length > 0 ) {
      res.end({
          statusCode:422
        , msg: 'Room already exists'
      })
    } else {
      db.insert(data, function(e,d){
        var statusCode = 500
          , url        ='/';
        if (!e) {
          statusCode = 200
          url        = '/'+data.room.replace('#','')+'/'
        } 
        if (referer.pathname.search('create')!=-1){
          res.redirect(url);
        } else{
          res.end({
            statusCode : statusCode
          , url        : url
          })
        }
      });
    }
  });
};
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
       res.redirect('/404?ref='+escape(room));
     }
  });
}).methods('GET')

app.route('/:room/new', function(req,res){
  req.on('data',function(da){
    
    var data = queryfied(da);
    if (data && !data.author) {
      data.author = {
          name :'Anon'
        , from: data.user
        , email :'aslda@node.com'
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
    var referer = url.parse(req.headers.referer)
    //based on default data not the doc, validation
    if (data.name.trim() ==='' || data.description.trim()===''  || /^-?(create|new|put|delete|patch|edit)*@/.test('-/'+data.name.trim()+'@') || doc.description.length < 200){
      var msg = 'The data is incorrect, invalid or too short';
      var code = 422;
      if (referer.pathname!=='/') {
        res.end({
            statusCode:code
          , info: 'Invalid Data'
          , msg: msg
        })
      } else {
        res.end(views.render('error',{
            code: code
          , info :msg
          , msg: msg
        }))
      }
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
            
            if (referer.pathname!=='/'){
              res.end({
                  statusCode : statusCode
                , url        : '/'+doc.room.replace('#','')+'/'+doc.url
              })
            } else {
              switch (statusCode){
                case 500:
                  res.redirect('/500')
                default:
                  res.redirect(url);
                  break;
              }
            }
          })
        }
      });
    }
  })
}).methods('POST');


app.route('/:room/create',function(req,res){
  with (req.route.params){
    var room = room; // ? weird eh?
    function get(){
      var _room = '#'+ req.route.params.room;
      db.view('sort','channel',{key:unescape(_room)},function(e,d){
        if (!e && d.rows.length > 0) {
          res.redirect('/'+req.route.params.room);
        } else {
          res.end(views.render('create',{
            room: req.route.params.room
          }))
        }
      });
    }
    function post(){
      req.on('data',function(da){
        var data = queryfied(da);
        saveRoom(req,res,data);
      });
    }
    switch (req.method) {
      case 'POST':
        post();
        break;
      case 'GET':
        get()
        break;
      default:
        res.end('NOT ALLOWED');
    }
  }
}).methods('GET','POST')



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
    log('info','running on port => '+port,'ideasBox');
  });
};
module.exports.run = run;


var colors = {
  'bold'      : ['\033[1m',  '\033[22m'],
  'italic'    : ['\033[3m',  '\033[23m'],
  'underline' : ['\033[4m',  '\033[24m'],
  'inverse'   : ['\033[7m',  '\033[27m'],
  'white'     : ['\033[37m', '\033[39m'],
  'grey'      : ['\033[90m', '\033[39m'],
  'black'     : ['\033[30m', '\033[39m'],
  'blue'      : ['\033[34m', '\033[39m'],
  'cyan'      : ['\033[36m', '\033[39m'],
  'green'     : ['\033[32m', '\033[39m'],
  'magenta'   : ['\033[35m', '\033[39m'],
  'red'       : ['\033[31m', '\033[39m'],
  'yellow'    : ['\033[33m', '\033[39m']
}

var log = function(level, log,title){
  var color =[]
  switch (level){
    case 'info':
      color = colors['cyan']
      break;
    case 'log':
      color = colors['magenta']
      break;
    case 'warn':
      color = colors['red']
      break;
    default:
      color = color['green']
     break;
  }
  console[level](colors['bold'][0],(title?title:'DEBUG'),':',colors['bold'][1],color[0],log,color[1]);
}