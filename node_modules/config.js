var cfg =  { 
    host: "ideasbox.iriscouch.com",
    port: "80",
    ssl :  false,
    user: "alejandromg",
    pass: "alejandro007"
  };
if (process.env.NODE_ENV=="production") {
  module.exports.bd = "http://" +cfg.user + ":"+cfg.pass + "@"+ cfg.host +":" + cfg.port;
} else {
  module.exports.bd = 'http://localhost:5984'
}