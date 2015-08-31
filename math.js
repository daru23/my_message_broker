/**
 * Created by dans on 8/31/15.
 */

var busInit = require('./busInit.js');

var channel;

busInit.init('math', process.pid, function (channel) {
   console.log(channel);

    //for now
    busInit.listen(channel, function (message) {
        console.log(message)
    });
});



function sum (n, m){

    return n+m;

}

function multiply (n, m) {

    return n*m;

}

