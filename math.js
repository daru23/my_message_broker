/**
 * Created by dans on 8/31/15.
 */

var busInit = require('./busInit.js');

var channel;

busInit.init('math', process.pid, function (assignedChannel) {
    channel = assignedChannel;
    console.log('Channel assigned: %s',assignedChannel);
});

setTimeout(function () {
//for now
    busInit.listen(channel, function (msg) {

        var data = msg.data;
        var functionName = msg.request.function;

        //some logic to apply function
        var arguments = '';
        for(var value in data){
            arguments+=(data[value])+',';
        }

        //delete last comma
        arguments = arguments.substring(0, arguments.length - 1);
        var answer = eval(functionName+'('+arguments+')') ;

        busInit.sendAnswer(msg, answer)

    });

}, 2000);

setTimeout(function () {
//for now
    var data = {"n": 2 , "m" : 3};
    var request = {"service" : "math", "function": "sum"};
    busInit.sendMessage('math', process.pid, data, request, function (answer) {
        console.log('Answer: %j', answer)
    });

    request = {"service" : "math", "function": "multiply"};
    busInit.sendMessage('math', process.pid, data, request, function (answer) {
        console.log('Answer: %j', answer)
    })


}, 3000);

function sum (n, m){

    return n+m;

}

function multiply (n, m) {

    return n*m;

}

