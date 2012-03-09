#!/usr/bin/env node

/*
 * ideasbox
 * @date:Thu Mar 08 2012 21:25:59 GMT-0600 (CST)
 * @name: ideasbox.js
 * @licence: MIT
*/


var http = require('http');

var app = http.createServer(function(req,res){
   res.end('I\'m ideasbox, and you');
});


function run(port) {
  port = port || 8000;
  app.listen(port, function() {
    console.log('running on port: '+port);
  });
};
module.exports.run = run;
