//olhc node.js REST API

var http = require('http'),
    express = require('express'),
    mysql = require('mysql-libmysqlclient'),
    conn = mysql.createConnectionSync();


conn.connectSync('localhost', 'root', 'dlwlsdn', 'bitstamp');
conn.setCharsetSync('utf8');

if (!conn.connectedSync()) {
  util.puts("Connection error " + conn.connectErrno + ": " + conn.connectError);
  process.exit(1);
}

var sockets_list = [];
//var graph_type = '15m';

var app = express();
app.get('/period', function(req, res){
  getOLHCPeriod(req.query.start, req.query.end, req.query.type, function(err, result) {
    if(err)
      console.log('SQLError ' + err);

    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
    res.end(result);
  });
});

app.get('/new', function(req, res){
  getNewOLHC(req.query.start, req.query.type, function(err, result) {
    if(err)
      console.log('SQLError ' + err);

    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
    res.end(result);
  });
});

app.get('/old', function(req, res){
  getOldOLHC(req.query.end, req.query.type, function(err, result) {
    if(err)
      console.log('SQLError ' + err);

    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
    res.end(result);
  });
});

app.get('/', function(req, res){
  getOLHC(req.query.type, function(err, result) {
    if(err)
      console.log('SQLError ' + err);

    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
    res.end(result);
  });
});


app.listen(3000);


function getNewOLHC(start_timestamp, graph_type, callback) {
  start_timestamp = parseInt(start_timestamp);

  return getSQL('SELECT timestamp as t, open as o, low as l, high as h, close as c, volume as v FROM OLHC_' + (graph_type/60 + 'm') + ' where timestamp >= ' + start_timestamp, callback);
}


function getOLHCPeriod(start_timestamp, end_timestamp, graph_type, callback) {
  start_timestamp = parseInt(start_timestamp);
  end_timestamp = parseInt(end_timestamp);

  return getSQL('SELECT timestamp as t, open as o, low as l, high as h, close as c, volume as v FROM OLHC_' + (graph_type/60 + 'm') + ' where timestamp BETWEEN ' + start_timestamp + ' AND ' + end_timestamp, callback);
}

function getOldOLHC(end_timestamp, graph_type, callback) {
  return getSQL('SELECT timestamp as t, open as o, low as l, high as h, close as c, volume as v FROM OLHC_' + (graph_type/60 + 'm') + ' where timestamp BETWEEN ' + (end_timestamp - 2678400) + ' AND ' + (end_timestamp-1), callback);
}

function getOLHC(graph_type, callback) {
  return getSQL('SELECT timestamp as t, open as o, low as l, high as h, close as c, volume as v FROM OLHC_' + (graph_type/60 + 'm') + ' where date BETWEEN DATE_SUB(NOW(), INTERVAL ' + ((graph_type/60) * 1440) + ' MINUTE ) AND NOW()', callback);
}

function getSQL(query, callback) {
  console.log('Query : ' + query);
  conn.pingSync();
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

process.on('exit', function () {
  conn.closeSync();
});
/*
//pusher -> faye broadcasting
var lastUpdate;
var faye = require('faye');
var pusher = new PusherClient ({
    appId: 'de504dc5763aeef9ff52', key: 'de504dc5763aeef9ff52', secret:''
  });
//Faye server
var bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});
var server = http.createServer(function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin':'*'});
    var json = {"lastUpdate" : (new Date() - lastUpdate)};
    response.end(JSON.stringify(json));
});

bayeux.attach(server);
server.listen(8000);


//bitstamp socket
try
{
    pusherType();

}
catch(e)
{
    console.log(e);
    console.log('pusher error');
}

function pusherType() {
    pusher.on('connect', function(){
        console.log('connected');      

        var trade = pusher.subscribe("live_trades");
        trade.on('success', function(a){
            trade.on('trade', function(msg){
                //{ price: 672.03, amount: 0.01, id: 3934930 }
                //console.log(msg);
                lastUpdate = new Date();
            });
        });
    });

    pusher.connect();
};
*/