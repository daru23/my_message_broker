/*
 * index.js
 * Message Broker
 *-----------------------------------------------------
 * Author: Daniela Ruiz
 * Email: daru015@gmail.com
 *-----------------------------------------------------
 */

/* Require packages*/
var Joi = require('joi'),
    crypto = require('crypto');
/* My modules */
var emptyMsg = require('./msg.json');

/**
 * Message Schema for Joi Validation
 * @type {Array}
 */
var msgTemplate = Joi.object().keys({
    ack : Joi.number().required(),
    type : Joi.string().required(),
    msgpid : Joi.number().required(),
    msgID:   Joi.string().length(40).required(),
    timestamp:  Joi.number().integer().required(),
    serviceID : Joi.string().required(),
    respondChannel: Joi.string().allow(''),
    request : Joi.object().keys({
        "service" : Joi.string().regex(/(\w)*/).allow(''),
        "function" : Joi.string().regex(/(\w)*/).allow('')
    }),
    trackingChain: Joi.array().items(Joi.object().keys({
        service: Joi.string().regex(/(\w)*/).allow(''),
        timestamp: Joi.number().integer()
    })),
    data: Joi.object(),
    error: Joi.object().keys({
        errorID: Joi.number().integer(),
        message: Joi.string().regex(/(\w)*/).allow('')
    })
}).optionalKeys('request', 'data', 'trackingChain');


var service = {
    create:function(serviceID, pid) {
        // Create a message using the template
        //  A message always is create with ack = 0 and type NORMAL
        var message = emptyMsg;
        var buffer = new Buffer(((new Date()).getTime()).toString(), "utf-8");
        message.serviceID = serviceID;
        message.msgpid = pid;
        message.msgID =  ((crypto.createHash('sha1').update(buffer)).digest('hex')).toString();
        message.timestamp = Math.round((new Date()).getTime() / 1000);

        var validation = Joi.validate(message,msgTemplate);
        if (validation.error == null && validation.value != null){
            return validation.value;
        }else{
            return validation.error;
        }
    },
    setData:function(message, data){
        // Parse a message and see if everything went ok, return the data
        message.data = data;
        var validation = Joi.validate(message,msgTemplate);
        if (validation.error == null && validation.value != null){
            return validation.value;
        }else{
            return validation.error;
        }  // err === null -> valid
    },
    setRequest:function(message, request){
        // Parse a message and see if everything went ok, return the data
        message.request = request;
        var validation = Joi.validate(message,msgTemplate);
        if (validation.error == null && validation.value != null){
            return validation.value;
        }else{
            return validation.error;
        }  // err === null -> valid
    },
    setType:function(message, type){
        // Parse a message and see if everything went ok, return the data
        message.type = type;
        var validation = Joi.validate(message,msgTemplate);
        if (validation.error == null && validation.value != null){
            return validation.value;
        }else{
            return validation.error;
        }  // err === null -> valid
    },
    getData:function(message){
        // Parse a message and see if everything went ok, return the data
        var validation = Joi.validate(message,msgTemplate);
        if (validation.error == null && validation.value != null){
            return validation.value.data;
        }else{
            return validation.error;
        }  // err === null -> valid
    },
    getRequest:function(message){
        // Parse a message and see if everything went ok, return the data
        var validation = Joi.validate(message,msgTemplate);
        if (validation.error == null && validation.value != null){
            return validation.value.request;
        }else{
            return validation.error;
        }  // err === null -> valid
    },
    verify:function(message){
        var validation = Joi.validate(message,msgTemplate);
        if (validation.error == null && validation.value != null){
            return validation.value;
        }else{
            return validation.error;
        }  // err === null -> valid
    }
};

module.exports = service;