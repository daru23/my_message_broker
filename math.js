/**
 * Created by dans on 8/31/15.
 */

var busInit = require('./busInit.js');

var channel;

busInit.init('math', process.pid, function (assignedChannel) {
    channel = assignedChannel;
    console.log(assignedChannel);
});

setTimeout(function () {
//for now
    busInit.listen(channel, function (msg) {

        var data = msg.data;
        var request = msg.request;
        //some logic to apply function

        var answer = sum(data.n, data.m);

        busInit.sendAnswer(msg, answer)

    });

}, 2000);

setTimeout(function () {
//for now
    var data = {"n": 2 , "m" : 2};
    var request = {"service" : "math", "function": "sum"};
    busInit.sendMessage('math', process.pid, data, request, function (answer) {
        console.log('Answer: %j', answer)
    })

}, 5000);

function sum (n, m){

    return n+m;

}

function multiply (n, m) {

    return n*m;

}

