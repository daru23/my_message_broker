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
    publishClient = redis.createClient(config.redis.port, config.redis.server),
    client = redis.createClient(config.redis.port, config.redis.server);


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
            var assignedChannel = msg.serviceID +'_'+ msg.msgpid;
            msg.ack = 1;
            msg.respondChannel = assignedChannel;
            publishClient.publish('brokerInitChannel', JSON.stringify(msg));
            client.hset('services', msg.serviceID, 1);
            client.hset(msg.serviceID, assignedChannel, 1);
        //Sending a message
        } else {
            // look for the service and forward the message
            // check in list of service
            // send the message to the service
            //send the message to the brokerChannel as ack=1
            if (msg.request.service !== '' && msg.request.function !== '') {
                client.hgetall('services', function (error, servicesHash) {
                    if (error) {
                        console.log(error);
                        msg.error.code = 1; //for example this should be defined somewhere
                        msg.error.message = 'not services available'; //for example this should be defined somewhere
                        publishClient.publish(msg.respondChannel, JSON.stringify(msg));
                    } else if (servicesHash !== null) {
                        var check = false; // to do it just once
                        for (var service in servicesHash) {
                            if (service === msg.request.service && check === false) { // look for a service channel
                                check = true;
                                client.hgetall(msg.request.service, function (error, serviceReqHash) {
                                    if (error) {
                                        console.log(error);
                                        msg.error.code = 1; //for example this should be defined somewhere
                                        msg.error.message = 'not service available'; //for example this should be defined somewhere
                                        publishClient.publish(msg.respondChannel, JSON.stringify(msg));
                                    } else if (servicesHash !== null) {
                                        var check2 = false; // to do it just once
                                        for (var serviceChannel in serviceReqHash) {
                                            if (serviceReqHash[serviceChannel] === "1" && check2 === false) {
                                                check2 = true;
                                                publishClient.publish(serviceChannel, JSON.stringify(msg));
                                            }
                                        }

                                    }
                                });
                            }
                        }
                    }
                });
            } else {
                console.log('Request: service and function are not set');
                msg.error.code = 1; //for example this should be defined somewhere
                msg.error.message = 'Request: service and function are not set'; //for example this should be defined somewhere
                publishClient.publish(msg.respondChannel, JSON.stringify(msg));
            }


        }
    }catch(e){
        console.log("Message is not a valid json")
    }

});

listenClient.subscribe('broker');

// Exit clean from redis
process.on('exit', function() {
    console.log('Broker is down');
    listenClient.quit();
    publishClient.quit();
    process.exit(0);
});