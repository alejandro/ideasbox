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
  ;

function Parser(home){
  this.HOME = path.join(home);
  this.layout = path.join(this.HOME, 'layout.jade');
}
Parser.prototype.render = function(file, locals){
  if (path.extname(file) === '') file += '.jade'
  if (path.extname(file)==='.jade') {
    var _layout = fs.readFileSync(this.layout,'utf8')
    var _file = fs.readFileSync(path.join(this.HOME, file), 'utf8')
    var page = jade.compile(_file);
    page = page(locals)
    var response = jade.compile(_layout);
    response = response({body:page});
    return response;
  } else {
    return new Error('Invalid Extension Name: ' + path.extname(file))
  }
}
var views = new Parser(path.join(__dirname,'..','views'));

app.route('/')
   .html(function(req,res){
    res.end(views.render('index',{
       name:'alejandromg'
     }))
   })
   .methods('GET')
   ;

// Static Provider
app.route('/assets/*').files(path.join(__dirname,'..','public'));

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
