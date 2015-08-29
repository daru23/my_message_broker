/*
 * index.js
 *
 * Message Broker
 *-----------------------------------------------------
 * Author: Daniela Ruiz
 * Email: daru015@gmail.com
 *-----------------------------------------------------
 */

/* Require packages*/
var Joi = require('joi');


/**
 * Message Schema for Joi Validation
 * @type {Array}
 */
var msgTemplate = Joi.object().keys({
    ack : Joi.number().required(),
    type : Joi.string().required(),
    msgpid : Joi.number().required(),
    mesgUuiID:   Joi.string().length(40).required(),
    timestamp:  Joi.number().integer().required(),
    serviceID : Joi.string().required(),
    respondChannel: Joi.string(),
    request : Joi.object().keys({
        "service" : Joi.string(),
        "function" : Joi.string()
    }),
    brokerChain: Joi.array().items(Joi.object().keys({
        brokerID: Joi.string(),
        timestamp: Joi.number().integer()
    })),
    data: Joi.object(),
    error: Joi.object().keys({
        errorID: Joi.number().integer(),
        message: Joi.string()
    })
});

/**
 * mpty Template to get fill
 * @type {{ack: number, type: string, msgpid: number, mesgUuiID: string, timestamp: number, serviceID: string, respondChannel: string, brokerChain: Array, request: {service: string, function: string}, data: {}, error: {errorID: number, message: string}}}
 */
var emptyMsg = {
    "ack": 0,
    "type": "",
    "msgpid": 0,
    "mesgUuiID": "",
    "timestamp": 0,
    "serviceID": "",
    "respondChannel": "",
    "brokerChain": [],
    "request" : {
        "service": "",
        "function": ""
    },
    "data": {},
    "error": {
        "errorID": 0,
        "message": "Default"
    }
};

var service = {
    create:function(type, serviceID, respondChannel, pid) {
        // Create a message using the template
        //  A message always is create with ack = 0
        var msg = {};
        var message = emptyMsg;
        message.ack = 0;
        message.type = type;
        message.serviceID = serviceID;
        message.msgpid = pid;
        message.respondChannel = respondChannel;
        message.mesgUuiID = '1234567890123456789012345678901234567890';//crypto.createHash('sha1');
        message.timestamp = Math.round((new Date()).getTime() / 1000);

        Joi.validate(message,msgTemplate, function (err, value) {
            if (err) console.log(err);
            //return object
            return value;
        });

    },
    parse:function(msg){
        // Parse a message and see if everything went ok, return the request and data
        var info = {"request" : "", "data" : ""};
        Joi.validate(msg, msgTemplate, function (err, value) {
            info.request = value.request;
            info.data = value.data;
        });  // err === null -> valid

        return info;
    },
    verify:function(msg){

        var message = {};
        // Verify a message and see if the syntax is ok
        Joi.validate(msg, msgTemplate, function (err, value) {
            if (err) return err;
            else
                return value
        });  // err === null -> valid

    }
};

module.exports = service;
