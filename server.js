var express = require('express');
var proxy = require('http-proxy-middleware');
var zlib = require('zlib');
var colors = require('colors/safe');
var morgan = require('morgan');
var fs = require('fs');

var filePath = "./var/stubs-" + new Date().getDay() + "-" + new Date().getHours() + "-" + new Date().getMinutes() + ".json";
fs.writeFileSync(filePath);

var requests = [];
var currentRequest;

var options = {
  target: 'https://slack.com', // target host
  changeOrigin: true,                         // needed for virtual hosted sites
  onProxyReq: function(proxyReq, req, res) {
    // console.log(colors.blue("\n[" + new Date().g + "] - ") + req.url);
    // console.log(colors.green("[Request]"));
    // console.log(colors.green("Reques Headers: ") + JSON.stringify(req.headers, null, 2));
    var body = "";

    req.on('data', function(chunk) {
        body += chunk;
    });
    req.on('end', function() {
        // console.log(colors.green("Reques Body: ") + unescape(body));
        // console.log("\n");
    });

  },

  /**
   * @param {http.IncomingMessage} proxyRes 
   * @param {http.IncomingMessage} req 
   * @param {http.IncomingMessage} res 
   */
  onProxyRes: function(proxyRes, req, res) {
    console.log(colors.green(req.method + " " + req.url + " " + proxyRes.statusCode + " " + proxyRes.statusMessage));
    // console.log(colors.green("Response Status: ") + proxyRes.statusCode);
    // console.log(colors.green("Response Headers: ") + JSON.stringify(proxyRes.headers, null, 2));

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
      //console.log(colors.green("Response Body: ") + body);

      var record = {
        "request": {
          "url": req.url,
          "methos": req.method
        },
        "response": {
          "status": proxyRes.statusCode,
          "headers": proxyRes.headers,
        }
      }

      if(("content-type" in proxyRes.headers) && proxyRes.headers["content-type"].includes("application/json")) {
        record.response.json = JSON.parse(body);
      } else {
        record.response.body = body;
      }

      requests.push(record);

      fs.writeFileSync(filePath, JSON.stringify(requests, null, 2));
    });
  }
};

var exampleProxy = proxy(options);

var app = express();

app.use('/', exampleProxy);
app.listen(3005);

console.log("Server listening on: http://localhost:3005");
