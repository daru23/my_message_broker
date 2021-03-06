/*
 * index.js
 * Message Broker
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
pingServices ();

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

        // Set broker in the chain

        msg.trackingChain.push({"service" : "broker_"+process.pid, "timestamp": (new Date()).getTime()});

        //Asking for a channel
        if (msg.respondChannel === ''){
            //assign channel
            var assignedChannel = msg.serviceID +'_'+ msg.msgpid;
            msg.ack = 1;
            msg.respondChannel = assignedChannel;
            console.log('New service has been added %s', msg.serviceID);
            addService(msg.serviceID, {"channel": assignedChannel, "status" : 0, "timestamp" : (new Date()).getTime()}); //TODO a service always start deactivated
            publishClient.publish('brokerInitChannel', JSON.stringify(msg));

        //Sending a message
        } else {
            // look for the service and forward the message
            // check in list of service
            // send the message to the service
            //send the message to the brokerChannel as ack=1
            if (msg.request.service !== '' && msg.request.function !== '') {

                var serviceAssgined = selectService(msg.request.service);

                if (typeof(serviceAssgined) == 'string') {

                    msg.error.code = 2; //for example this should be defined somewhere
                    msg.error.message = serviceAssgined; //for example this should be defined somewhere
                    publishClient.publish(msg.respondChannel, JSON.stringify(msg));
                } else {
                    publishClient.publish(serviceAssgined.channel, JSON.stringify(msg));
                }

            } else {
                console.log('Request: service and function are not set');
                msg.error.code = 1; //for example this should be defined somewhere
                msg.error.message = 'Request: service and function are not set'; //for example this should be defined somewhere
                publishClient.publish(msg.respondChannel, JSON.stringify(msg));
            }

        }

    } catch (e) {
        console.log(e);
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
        publishClient  = redis.createClient(config.redis.port, config.redis.server),
        client  = redis.createClient(config.redis.port, config.redis.server);

    publishClient.publish('uServicesChannel', 'UPDATE');

    listenClient.on('message', function(channel, message) {

        client.get('uServices', function(err, reply) {
            uServices = JSON.parse(reply);
            console.log('uServices UPDATE ', uServices);
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

    listenClient.on("error", function (err) {
        console.log("Redis listen " + name + " error " + err);
    });

    listenClient.on('message', function(channel, message) {

        client.get('uBrokers', function(err, reply) {
            uBrokers = JSON.parse(reply);
        });

    });

    listenClient.subscribe('uBrokersChannel');
}

function selectService (service){

    var publishClient  = redis.createClient(config.redis.port, config.redis.server),
        client  = redis.createClient(config.redis.port, config.redis.server);

    if(typeof(uServices[service]) !== 'undefined'){

        var uService = uServices[service], //array
            activeuService = uService[0];

        // the first service should be active but if is not, should look for an active one

        if (activeuService.status == 0) {

            var foundOne = false;

            for ( var i = 0 ; i < uService.length ; i++ ){
                if ( foundOne == false && uService[i].status == 1 ) {
                    activeuService = uService[i];
                    foundOne = true;
                }
            }
            //if there is not active service just stay whith the first one
        }

        activeuService.status = 0;     //change state to busy
        uService.push(activeuService); // pushing the service at the end of the list
        uService.shift();              //take the service out of the list
        uService[0].status = 1;        //activate other service

        //save the new uServices
        uServices[service] = uService;

        // changing the variable on redis
        client.set('uServices', JSON.stringify(uServices));
        // Publish that it did an update
        publishClient.publish('uServicesChannel', 'UPDATE');

        return activeuService;

    } else {
        return "not services with name "+service;
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

function pingServices () {

    var listenClient  = redis.createClient(config.redis.port, config.redis.server);
    var client  = redis.createClient(config.redis.port, config.redis.server);
    var publishClient  = redis.createClient(config.redis.port, config.redis.server);


    var pingChannel = 'broker_'+process.pid+'_ping';

    setInterval(function () {

        for(var k in uServices) {
            for (var j = 0; j < uServices[k].length; j++) {

                var msg = msgModule.create('broker', process.pid);
                msg.respondChannel = pingChannel;
                msg.request.service = uServices[k][j].channel;
                msg.request.function = 'ping';

                console.log('ping to %s', uServices[k][j].channel);
                publishClient.publish(uServices [k][j].channel+'_ping', JSON.stringify(msg));
            }
        }

    }, 1000);

    listenClient.on("error", function (err) {
        console.log("Redis listen " + name + " error " + err);
    });

    listenClient.on('message', function(channel, message) {

        try {
            msg = JSON.parse(message);
            msg = msgModule.verify(msg); // validation of the message

            if (msg.ack == 1 && msg.request.function == 'pong') {
                // keep the service alive

                for (var k in uServices) {

                    for (var j = 0; j < uServices[k].length; j++) {

                        if (uServices[k][j].channel == msg.request.service) {

                            uServices[k][j].timestamp = (new Date()).getTime();

                            client.set('uServices', JSON.stringify(uServices));
                            // Publish that it did an update
                            publishClient.publish('uServicesChannel', 'UPDATE');
                            console.log('have a pong from %s!', msg.request.service);

                        }
                    }
                }
            }

        } catch (e) {
            console.log(e);
            console.log("Message is not a valid json");
        }

    });

    listenClient.subscribe(pingChannel);

    //TODO if timestamp is too old the service is dead
    setInterval(function () {
        //get the key of a json

        var change = false;

        for (var k in uServices) {
            var servicesAlive = [];

            for (var j = 0; j < uServices[k].length; j++) {

                var now = (new Date()).getTime();

                //console.log(( now - uServices[k][j].timestamp ));

                if (( now - uServices[k][j].timestamp ) < 3000) {
                    servicesAlive.push(uServices[k][j]);
                    change = true;
                }
            }
            uServices[k] = servicesAlive;
        }

        if (change == true) {
            //// Publish that it did an update
            client.set('uServices', JSON.stringify(uServices));
            publishClient.publish('uServicesChannel', 'UPDATE');
            //console.log('uServices UPDATE ', uServices);
        }

    }, 3000);

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