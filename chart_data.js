//1.1 mysql -> json
//1.2 mysql -> redis -> json
//1.3 bitstamp -> transaction -> olhc

//try 1.3
//https://www.bitstamp.net/api/transactions/?time=hour
var oldest_timestamp;
var lastest_timestamp;
var olhc_list = [];

//loop();
getOLHCPeriod(1401035200 , 1401275200, 0);
//getNewOLHC(0);

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

function mergeOldOLHC(list) {
    if(list == null)
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
    init();
}

function updateOldestTimestamp(oldest) {
    if(oldest_timestamp == null || oldest_timestamp > oldest)
        oldest_timestamp = oldest;
}
function updateLastestTimestamp(latest) {
    if(lastest_timestamp == null || lastest_timestamp < latest)
        lastest_timestamp = latest;
}

function getOLHC(count) {
    $.ajax({
        type:'GET',
        url:'http://localhost:3000',
        success:function(json){
            mergeOldOLHC(json);
        },
        error:function(request,status,error){ console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error); }
    });
}

function getOLHCPeriod(start_timestamp, end_timestamp, count) {
    $.ajax({
        type:'GET',
        url:'http://localhost:3000/period?start=' + start_timestamp + '&end=' + end_timestamp,
        success:function(json){
            mergeOldOLHC(json);
        },
        error:function(request,status,error){ console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error); }
    });
}