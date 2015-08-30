/*
 * test.js
 *
 * Tests for Message Broker
 *-----------------------------------------------------
 * Author: Daniela Ruiz
 * Email: daru015@gmail.com
 *-----------------------------------------------------
 */

/* Require Modules */
var assert = require("assert");
/* Require My Modules */
var msgModule = require('../messages.js');

/* Global variable for tests */
var msgGlobal = msgModule.create('BROADCAST', 'testService', process.pid);

describe('Messages', function() {
    describe('create message', function () {
        it('create a message and return object', function () {
            assert.deepEqual(msgGlobal,msgModule.create('BROADCAST', 'testService', process.pid));
        });
        //TYPE ERROR
        it('Wrong type and return error', function () {
            assert.equal('"type" must be a string',(msgModule.create(0, "testService", process.pid)).details[0].message);
        });
        it('Wrong type and return error', function () {
            assert.equal('"type" must be a string',(msgModule.create([], "testService", process.pid)).details[0].message);
        });
        it('Wrong type and return error', function () {
            assert.equal('"type" must be a string',(msgModule.create({}, "testService", process.pid)).details[0].message);
        });
        //SERVICEID
        it('Wrong servieID return error', function () {
            assert.equal('"serviceID" must be a string',(msgModule.create('BROADCAST', 0, process.pid)).details[0].message);
        });
        it('Wrong servieID return error', function () {
            assert.equal('"serviceID" must be a string',(msgModule.create('BROADCAST', {}, process.pid)).details[0].message);
        });
        it('Wrong servieID return error', function () {
            assert.equal('"serviceID" must be a string',(msgModule.create('BROADCAST', [], process.pid)).details[0].message);
        });
        //PID
        it('Wrong pid return error', function () {
            assert.equal('"msgpid" must be a number',(msgModule.create('BROADCAST', "testService", "")).details[0].message);
        });
        it('Wrong pid return error', function () {
            assert.equal('"msgpid" must be a number',(msgModule.create('BROADCAST', "testService", {})).details[0].message);
        });
        it('Wrong pid return error', function () {
            assert.equal('"msgpid" must be a number',(msgModule.create('BROADCAST', "testService", [])).details[0].message);
        });
    });
    describe('setData message', function () {
        it('set data to a message and return object', function () {
            msgGlobal.data = {"value" : 1};
            var testMsg =msgModule.create('BROADCAST', 'testService', process.pid);
            assert.deepEqual(msgGlobal,msgModule.setData(testMsg, {"value": 1}));
        });
    });
    describe('setRequest message', function () {

    });
    describe('getData message', function () {

    });
    describe('getRequest message', function () {

    });
    describe('verify message', function () {

    })
});

/*
{ [ValidationError: child "type" fails because ["type" must be a string]]
    name: 'ValidationError',
        details:
    [ { message: '"type" must be a string',
        path: 'type',
        type: 'string.base',
        context: [Object] } ],
        _object:
    { ack: 0,
        type: 0,
        msgpid: 9380,
        msgID: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
        timestamp: 1440957662,
        serviceID: 'testService',
        respondChannel: '',
        request: { service: '', function: '' },
        trackingChain: [],
            data: {},
        error: { errorID: 0, message: '' } },
    annotate: [Function] }
*/



//console.log(msg);
//console.log(service.verify(msg));
//console.log(service.getData(msg));
//console.log(service.setData(msg, {"value": 1}));
//console.log(service.getData(msg));
//console.log(service.getRequest(msg));
//console.log(service.setRequest(msg, {"service" : "math", "function" : "multiply"}));
//console.log(service.getRequest(msg));
