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


var service = {
  init: function(service, pid, callback){

      var listenClient  = redis.createClient(config.redis.port, config.redis.server),
          publishClient = redis.createClient(config.redis.port, config.redis.server);
      // Catch redis errors
      listenClient.on('error', function (error) {

          console.log('listenClient error: %s', error)

      });

      // Catch redis message
      listenClient.on("message", function (channel, message) {

          var msg;
          try {
              msg = JSON.parse(message);
              msg = msgModule.verify(msg); // validation of the message

              if (msg.ack === 1 && msg.serviceID == service) { // a channel have been assign
                  // Catch redis errors
                  callback(msg.respondChannel);
                  //callback or logic mthread
              }

          } catch (e){
              console.log("Message is not a valid json")
          }

      });

      listenClient.subscribe('brokerInitChannel');
      var msg = msgModule.create(service, pid);
      publishClient.publish('broker', JSON.stringify(msg));
  },
  listen : function(channel, callback){

      var listenClient  = redis.createClient(config.redis.port, config.redis.server),
          publishClient = redis.createClient(config.redis.port, config.redis.server);

      listenClient.on('error', function (error) {

          console.log('listenClient error: %s', error)

      });
      // Catch redis message
      listenClient.on("message", function (channel, message) {
          var msg;
          try {
              msg = JSON.parse(message);
              msg = msgModule.verify(msg); // validation of the message
              callback(msg);
          } catch (e) {
              console.log("Message is not a valid json")
          }
      });

      listenClient.subscribe(channel);
  },
  sendAnswer : function (message, data) {
      var publishClient = redis.createClient(config.redis.port, config.redis.server);

      var answer = {"value" : data};
      var msg = msgModule.setData(message, answer);

      publishClient.publish(msg.respondChannel, JSON.stringify(msg));
  },
  sendMessage : function (service, pid, data, request, callback){
      var listenClient  = redis.createClient(config.redis.port, config.redis.server),
          publishClient = redis.createClient(config.redis.port, config.redis.server);

      var msg = msgModule.create(service, pid);
      msg = msgModule.setData(msg, data);
      msg = msgModule.setRequest(msg, request);
      msg.respondChannel = service+'_'+pid+'_PrivateChannel';

      publishClient.publish('broker', JSON.stringify(msg));

      listenClient.on('error', function (error) {

          console.log('listenClient error: %s', error)

      });
      // Catch redis message
      listenClient.on("message", function (channel, message) {
          var msg;
          try {
              msg = JSON.parse(message);
              msg = msgModule.verify(msg); // validation of the message
              callback(msg.data);
          } catch (e) {
              console.log("Message is not a valid json")
          }
      });

      listenClient.subscribe(service+'_'+pid+'_PrivateChannel');
  }
};

module.exports = service;

//"publish" "broker" "{\"ack\":0,\"type\":\"NORMAL\",\"msgpid\":6010,\"msgID\":\"da39a3ee5e6b4b0d3255bfef95601890afd80709\",\"timestamp\":1441052395,\"serviceID\":\"math\",\"respondChannel\":\"mathPrivate\",\"request\":{\"service\":\"\",\"function\":\"\"},\"trackingChain\":[],\"data\":{},\"error\":{\"errorID\":0,\"message\":\"\"}}"
