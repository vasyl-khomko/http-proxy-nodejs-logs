var express = require('express');
var proxy = require('http-proxy-middleware');
var zlib = require('zlib');
var colors = require('colors/safe');
var morgan = require('morgan');
var fs = require('fs');
var http = require('http');
var dateFormat = require('dateformat');

var FILE_PATH = "./var/stubs_" + dateFormat(new Date(), "yy-mm-dd_HH:MM:ss") + ".json";

fs.writeFileSync(FILE_PATH, "[]");

var requests = [];
var currentRequest;

var options = {
  target: 'https://vasyl-kh1.wixanswers.com', // target host
  changeOrigin: true,          // needed for virtual hosted sites

  onProxyRes: function(proxyRes, req, res) {
    console.log(colors.green(req.method + " " + req.url + " " + proxyRes.statusCode + " " + proxyRes.statusMessage));

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

      var record = {
        "request": {
          "url": req.url,
          "method": req.method
        },
        "response": {
          "status": proxyRes.statusCode,
          "headers": proxyRes.headers,
        }
      }

      if (("content-type" in proxyRes.headers) && proxyRes.headers["content-type"].includes("application/json")) {
        record.response.json = JSON.parse(body);
      } else {
        record.response.body = body;
      }

      requests.push(record);

      fs.writeFileSync(FILE_PATH, JSON.stringify(requests, null, 2));
    });
  }
};

var exampleProxy = proxy(options);

var app = express();

app.use('/', exampleProxy);
app.listen(3005);

console.log("Server listening on: http://localhost:3005");
