//olhc node.js REST API

var http = require('http'),
    express = require('express'),
    mysql = require('mysql-libmysqlclient'),
    conn = mysql.createConnectionSync();


conn.connectSync('localhost', 'root', 'dlwlsdn', 'bitstamp');
conn.setCharsetSync('utf8');

var sockets_list = [];
var graph_type = '15m';

var app = express();
app.get('/period', function(req, res){
  getOLHCPeriod(req.query.start, req.query.end, graph_type, function(err, result) {
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
    res.end(result);
  });
});

app.get('/new', function(req, res){
  getNewOLHC(req.query.start, graph_type, function(err, result) {
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
    res.end(result);
  });
});

app.get('/', function(req, res){
  getOLHC(graph_type, function(err, result) {
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
    res.end(result);
  });
});


app.listen(3000);


function getNewOLHC(start_timestamp, graph_type, callback) {
  start_timestamp = parseInt(start_timestamp);

  return getSQL('SELECT timestamp as t, open as o, low as l, high as h, close as c, volume as v FROM OLHC_' + graph_type + ' where timestamp >= ' + start_timestamp, callback);
}


function getOLHCPeriod(start_timestamp, end_timestamp, graph_type, callback) {
  start_timestamp = parseInt(start_timestamp);
  end_timestamp = parseInt(end_timestamp);
  
  return getSQL('SELECT timestamp as t, open as o, low as l, high as h, close as c, volume as v FROM OLHC_' + graph_type + ' where timestamp BETWEEN ' + start_timestamp + ' AND ' + end_timestamp, callback);
}

function getOLHC(graph_type, callback) {
  return getSQL('SELECT timestamp as t, open as o, low as l, high as h, close as c, volume as v FROM OLHC_' + graph_type + ' where date BETWEEN DATE_SUB(NOW(), INTERVAL 31 DAY) AND NOW()', callback);
}

function getSQL(query, callback) {
  conn.query(query, function(err, results) {
    if (err)
      return callback(err, null);
    else {
      results.fetchAll(function (err, rows) {
        if (err)
          return callback(ret, null);
        result = JSON.stringify(rows);
        return callback(null, result);
      });
    }
  });
}
