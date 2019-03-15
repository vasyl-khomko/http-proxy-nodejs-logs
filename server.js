var express = require('express');
var proxy = require('http-proxy-middleware');
var zlib = require('zlib');
var colors = require('colors/safe');

var options = {
  target: 'https://vasyl-test.atlassian.net', // target host
  changeOrigin: true,                         // needed for virtual hosted sites
  onProxyReq: function(proxyReq, req, res) {
    console.log(colors.blue("\n[" + new Date() + "] - ") + req.url);
    console.log(colors.green("[Request]"));
    console.log(colors.green("Reques Headers: ") + JSON.stringify(req.headers, null, 2));
    var body = "";

    req.on('data', function(chunk) {
        body += chunk;
    });
    req.on('end', function() {
        console.log(colors.green("Reques Body: ") + unescape(body));
        console.log("\n");
    });
  },
  onProxyRes: function(proxyRes, req, res) {
    console.log(colors.green("[Response]"));
    console.log(colors.green("Response Headers: ") + JSON.stringify(proxyRes.headers, null, 2));

    var output;
    if(proxyRes.headers['content-encoding'] == 'gzip') {
      var gzip = zlib.createGunzip();
      proxyRes.pipe(gzip);
      output = gzip;
    } else {
      output = proxyRes;
    }

    var body = "";

    output.on('data', function(chunk) {
        body += chunk.toString('utf-8');
    });
    output.on('end', function() {
      console.log(colors.green("Response Body: ") + body);
    });
  }
};

var exampleProxy = proxy(options);

var app = express();

app.use('/', exampleProxy);
app.listen(3005);

console.log("Server listening on: http://localhost:3005");
