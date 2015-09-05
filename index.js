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
    extend = require('extend-object'),
/* Required private modules */
    config = require('./config.json'),
    msgModule = require('./messages.js');

/*Master Logic*/
var listenClient  = redis.createClient(config.redis.port, config.redis.server),
    publishClient = redis.createClient(config.redis.port, config.redis.server),
    client = redis.createClient(config.redis.port, config.redis.server);


var uBrokers = {"brokers" : []},
    // { "brokers": [ { "channel" : "broker_1235" , "status" : 1 }, { "channel" : "broker_1234" , "status" : 0 }] }
    uServices = {};
// { "math"   : [ { "channel" : "math_1235" , "status" : 1 }, { "channel" : "math_1234" , "status" : 0 } ]}
// { "brokers": [ { "channel" : "broker_1235" , "status" : 1 }, { "channel" : "broker_1234" , "status" : 0 }] }

/* listener for update on this variable */
uServicesManager();

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
            console.log('new add');
            addService(msg.serviceID, {"channel": assignedChannel, "status" : 0}); //TODO a service always start deactivated

        //Sending a message
        } else {
            // look for the service and forward the message
            // check in list of service
            // send the message to the service
            //send the message to the brokerChannel as ack=1
            if (msg.request.service !== '' && msg.request.function !== '') {
                selectService(msg.serviceID);
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

/**********************************************************************************************************************/



/**
 * Worker Logic
 * I want this to listen always
 * Listen for UPDATE in the uServices object
 */
function uServicesManager(){

    var listenClient  = redis.createClient(config.redis.port, config.redis.server),
        client  = redis.createClient(config.redis.port, config.redis.server);

    listenClient.on('message', function(channel, message) {

        client.get('uServices', function(err, reply) {
            uServices = JSON.parse(reply);
            console.log('new uServices', uServices);
        });

    });

    listenClient.on("error", function (err) {
        console.log("Redis listen " + name + " error " + err);
    });

    listenClient.subscribe('uServicesChannel');
}

function uBrokersManager(){
    var listenClient  = redis.createClient(config.redis[0].port, config.redis[0].server),
        client  = redis.createClient(config.redis[0].port, config.redis[0].server);

    listenClient.on('message', function(channel, message) {

        client.get('uBrokers', function(err, reply) {
            uBrokers = JSON.parse(reply);
        });

    });

    listenClient.on("error", function (err) {
        console.log("Redis listen " + name + " error " + err);
    });


    listenClient.subscribe('uBrokersChannel');
}

function selectService (service){

    var publishClient  = redis.createClient(config.redis.port, config.redis.server),
        client  = redis.createClient(config.redis.port, config.redis.server);

    if(typeof(uServices[service]) !== 'undefined'){

        var uService = uServices[service], //array
            activeuService = uService[0];

        console.log(uServices);
        console.log(service);
        console.log(activeuService);
        uService.shift();              //take the service out of the list
        uService[0].status = 1;        //activate other service
        activeuService.status = 0;     //change state to busy
        uService.push(activeuService); // pushing the service at the end of the list

        //save the new uServices
        uServices[service] = uService;

        // changing the variable on redis
        client.set('uServices', JSON.stringify(uServices));
        // Publish that it did an update
        publishClient.publish('uServicesChannel', 'UPDATE');

        return activeuService;
    } else {

        // return an error cause there are no services with that name
    }
}

/**
 * Receive a service name and an object and stored it redis
 * @addService
 * @param service {String}
 * @param serviceObject {Object}
 */
function addService(service, serviceObject){

    var client  = redis.createClient(config.redis.port, config.redis.server);


    client.get('uServices', function(err, reply) {

        if (reply == null){
            //extend this object
            //add a key with service name and value service channel
            //this is the first service i should activate it
            var newObjectToPush = JSON.parse('{"' + service + '": []}');//found a fancy way to make this
            serviceObject.status = 1;
            newObjectToPush[service].push(serviceObject);
            extend(uServices, newObjectToPush);

            setAndPublish('uServices',uServices,'uServicesChannel', 'UPDATE')

        } else {
            uServices = JSON.parse(reply);
            if (typeof(uServices[service]) !== 'undefined') {

                var uService = uServices[service];

                uService.push(serviceObject);
                //save the new uServices
                uServices[service] = uService;

                setAndPublish('uServices',uServices,'uServicesChannel', 'UPDATE')

            } else {
                //extend this object
                //add a key with service name and value service channel
                var stringObject = '{"' + service + '": []}'; //found a fancy way to make this
                var objectToPush = JSON.parse(stringObject);
                objectToPush[service].push(serviceObject);
                extend(uServices, objectToPush);

                setAndPublish('uServices',uServices,'uServicesChannel', 'UPDATE')

            }
        }
    });

}

function setAndPublish(variableName, object, channel, option){

    var client  = redis.createClient(config.redis.port, config.redis.server);
    var publishClient  = redis.createClient(config.redis.port, config.redis.server);

    client.set(variableName, JSON.stringify(object));
    // Publish that it did an update
    publishClient.publish(channel, option);
}

/**********************************************************************************************************************/

listenClient.subscribe('broker');

// Exit clean from redis
process.on('exit', function() {
    console.log('Broker is down');
    listenClient.quit();
    publishClient.quit();
    process.exit(0);
});