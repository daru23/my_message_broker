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

              //TODO CATCH the error of the msg

              if (msg.ack === 1 && msg.serviceID == service && pid == msg.msgpid) { // a channel have been assign
                  // Catch redis errors
                  listenClient.unsubscribe();
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
          pingListenClient  = redis.createClient(config.redis.port, config.redis.server),
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
              console.log(e);
              console.log("Message is not a valid json")
          }
      });

      pingListenClient.on('error', function (error) {

          console.log('listenClient error: %s', error)

      });
      // Catch redis message
      pingListenClient.on("message", function (channel, message) {
          var msg;

          console.log('pong');
          try {
              msg = JSON.parse(message);
              msg = msgModule.verify(msg); // validation of the message

              msg.request.function = 'pong';
              msg.ack = 1;

              publishClient.publish(msg.respondChannel, JSON.stringify(msg))
          } catch (e) {
              console.log(e);
              console.log("Message is not a valid json")
          }
      });

      pingListenClient.subscribe(channel+'_ping');
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
              //listenClient.unsubscribe();
              callback(msg.data);
          } catch (e) {
              console.log("Message is not a valid json")
          }
      });

      listenClient.subscribe(service+'_'+pid+'_PrivateChannel');
  }
};

module.exports = service;
