//1.1 mysql -> json
//1.2 mysql -> redis -> json
//1.3 bitstamp -> transaction -> olhc

//try 1.3
//https://www.bitstamp.net/api/transactions/?time=hour
var oldest_timestamp;
var lastest_timestamp;
var olhc_list = [];
var graph_type = 60 * 15; // second

//loop();
setup_pusher();
//getOLHCPeriod(1401035200 , 1401275200, 0);
getOLHC(0, function() { init(); });


function loop() {
  var updateRedis = function(){	
    console.log('update transaction');
    getTransactions(0);
  }
  setInterval(updateRedis, 10*1000);
}

function addOLHC(obj) {
  var last = _.last(olhc_list);

  //TODO: check
  //key로 쓰는 timestamp를 어떤 단위로 묶을것인가?
  var timestamp = obj['t'];
  var price = obj['price'];
  var amount = obj['amount']

  if(last['t'] == timestamp)
  {
    //l,h,c,v 업데이트
    last['l'] = Math.min(last['l'], price);
    last['h'] = Math.max(last['h'], price);
    last['c'] = price;
    last['v'] += amount;
  }
  else
  {
    olhc_list.push({'t':timestamp, 'o':price, 'l':price, 'h':price, 'c':price, 'v':amount});
  }

  updateLastestTimestamp(timestamp);

  console.log('old ' + oldest_timestamp + ' lastest ' + lastest_timestamp);
}

function merge_old_olhc(list, callback) {
  if(list == null || list.length <= 0)
    return;

  //앞에가 old, 뒤에가 new
  olhc_list = _.union(list, olhc_list);


  var first = _.first(list);
  var last = _.last(list);


  var oldest = first['t'];
  updateOldestTimestamp(oldest);

  var latest = last['t'];
  updateLastestTimestamp(latest);

  //merge
  console.log('old ' + oldest_timestamp + ' lastest ' + lastest_timestamp);

  callback();
}

function add_to_olhc(json) {
  //{"t":1403252441,"p":585,"v":4};
  var key = Math.floor(json.t / graph_type) * graph_type;
  
  var last = _.last(olhc_list);
  if(last.t == key)
  {
    var p = json.p;
    last.c = p;
    last.h = (last.h<p?p:last.h);
    last.l = (last.l>p?p:last.l);
    last.v += json.v;
  }
  else
  {
    var new_json = {'t': key, 'o':json.p,'l':json.p, 'h':json.p, 'c':json.p, 'v':json.v};
    olhc_list.push(new_json);
  }
  
  refresh(0);
  
  //console.log('add : ' +  JSON.stringify(json) + ', new : ' +  JSON.stringify(_.last(olhc_list)));
}

function updateOldestTimestamp(oldest) {
  if(oldest_timestamp == null || oldest_timestamp > oldest)
    oldest_timestamp = oldest;
}
function updateLastestTimestamp(latest) {
  if(lastest_timestamp == null || lastest_timestamp < latest)
    lastest_timestamp = latest;
}

function getOLHC(count, callback) {
  $.ajax({
    type:'GET',
    url:'http://localhost:3000/?type=' + graph_type,
    success:function(json){
      merge_old_olhc(json, callback);
    },
    error:function(request,status,error){ console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error); }
  });
}

function getOldOLHC(count, callback) {
  $.ajax({
    type:'GET',
    url:'http://localhost:3000/old?end=' + oldest_timestamp + '&type=' + graph_type,
    success:function(json){
      merge_old_olhc(json, callback);
    },
    error:function(request,status,error){ console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error); }
  });
}

function getOLHCPeriod(start_timestamp, end_timestamp, count, callback) {
  $.ajax({
    type:'GET',
    url:'http://localhost:3000/period?start=' + start_timestamp + '&end=' + end_timestamp + '&type=' + graph_type,
    success:function(json){
      merge_old_olhc(json, callback);
    },
    error:function(request,status,error){ console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error); }
  });
}


//pusher
function setup_pusher()
{
  
  var j = {"t":1403252441,"p":585,"v":4};
  //console.log(Math.floor(j.t / graph_type) * graph_type);
  
  var pusher = new Pusher('de504dc5763aeef9ff52');
  var channel = pusher.subscribe("live_trades");

  console.log('login to pusher');
  channel.bind('pusher:subscription_succeeded', function() {
    console.log('bind success');
    
    channel.bind('trade', function(msg){
      //{ price: 672.03, amount: 0.01, id: 3934930 }
      var json = { 't':Math.round(+new Date()/1000)-1, 'p':parseFloat(msg.price), 'v': parseFloat(msg.amount)  };
      add_to_olhc(json);
    });
  });

  
}
