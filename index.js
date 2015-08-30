/*
 * index.js
 *
 * Message Broker
 *
 *-----------------------------------------------------
 * Author: Daniela Ruiz
 * Email: daru015@gmail.com
 *-----------------------------------------------------
 */

/* Required packages */
var redis = require('redis'),
/* Required private modules */
    config = require('./config.json'),
    msgModule = require('./messages.js');

/*Master Logic*/
var listenClient  = redis.createClient(config.redis.port, config.redis.server),
    publishClient = redis.createClient(config.redis.port, config.redis.server);


// Catch redis errors
listenClient.on('error', function (error) {

   console.log('listenClient error: %s', error)

});

// Catch redis message
listenClient.on("message", function (channel, message) {

    var msg;
    try{
        msg = JSON.parse(message);
        msg = msgModule.verify(msg); // validation of the message

        //Asking for a channel
        if (msg.respondChannel === ''){
            //assign channel
        //Sending a message
        } else {
            // look for the service and forward the message
        }
    }catch(e){
        console.log("Message is not a valid json")
    }

});

// Exit clean from redis
process.on('exit', function() {
    console.log('Broker is down');
    listenClient.quit();
    publishClient.quit();
    process.exit(0);
});