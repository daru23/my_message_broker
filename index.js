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
    config = ('./config.json');

/*Master Logic*/
var listenClient  = redis.createClient(config.redis.port, config.redis.server),
    publishClient = redis.createClient(config.redis.port, config.redis.server);


// Catch redis errors
listenClient.on('error', function (error) {

   console.log('listenClient error: %s', error)

});

// Catch redis message
listenClient.on("message", function (channel, message) {

    console.log('Master Broker has a message : %s', message);

});

// Exit clean from redis
process.on('exit', function() {
    console.log('Broker is down');
    listenClient.quit();
    publishClient.quit();
    process.exit(0);
});