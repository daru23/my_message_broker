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
var msgGlobal = msgModule.create('testService', process.pid);

describe('Messages', function() {
    describe('create message', function () {
        it('create a message and return object', function () {
            assert.deepEqual(msgGlobal,msgModule.create('testService', process.pid));
        });
        //SERVICEID
        it('Wrong servieID return error', function () {
            assert.equal('"serviceID" must be a string',(msgModule.create(0, process.pid)).details[0].message);
        });
        it('Wrong servieID return error', function () {
            assert.equal('"serviceID" must be a string',(msgModule.create({}, process.pid)).details[0].message);
        });
        it('Wrong servieID return error', function () {
            assert.equal('"serviceID" must be a string',(msgModule.create([], process.pid)).details[0].message);
        });
        //PID
        it('Wrong pid return error', function () {
            assert.equal('"msgpid" must be a number',(msgModule.create("testService", "")).details[0].message);
        });
        it('Wrong pid return error', function () {
            assert.equal('"msgpid" must be a number',(msgModule.create("testService", {})).details[0].message);
        });
        it('Wrong pid return error', function () {
            assert.equal('"msgpid" must be a number',(msgModule.create("testService", [])).details[0].message);
        });
    });
    describe('setData message', function () {
        it('set data to a message and return object', function () {
            msgGlobal.data = {"value" : 1};
            var testMsg =msgModule.create('testService', process.pid);
            assert.deepEqual(msgGlobal,msgModule.setData(testMsg, {"value": 1}));
            msgGlobal.data = {};
        });
        //ERROR
        //it('Wrong data return error', function () {
        //    msgGlobal.data = {"value" : 1};
        //    var testMsg =msgModule.create('BROADCAST', 'testService', process.pid);
        //    assert.deepEqual(msgGlobal,msgModule.setData(testMsg, ""));
        //});
    });
    describe('setRequest message', function () {
        it('set request to a message and return object', function () {
            msgGlobal.request = {"service" : "math", "function" : "multiply"};
            var testMsg =msgModule.create('testService', process.pid);
            assert.deepEqual(msgGlobal,msgModule.setRequest(testMsg,{"service" : "math", "function" : "multiply"}));
        });
        //ERROR
    });
    describe('getData message', function () {
        it('get data to a message and return object', function () {
            msgGlobal.data = {"value" : 1};
            assert.deepEqual({"value" : 1},msgModule.getData(msgGlobal));
            msgGlobal.data = {};
        });
    });
    describe('getRequest message', function () {
        it('get request to a message and return object', function () {
            msgGlobal.request = {"service" : "math", "function" : "multiply"};
            assert.deepEqual({"service" : "math", "function" : "multiply"},msgModule.getRequest(msgGlobal));
            msgGlobal.request = {};
        });
    });
    describe('verify message', function () {
        it('verify a message and return object', function () {
            assert.deepEqual(msgGlobal, msgModule.verify(msgGlobal));
        });
    });
    //TYPE ERROR
    //it('Wrong type and return error', function () {
    //    assert.equal('"type" must be a string',(msgModule.create(0, "testService", process.pid)).details[0].message);
    //});
    //it('Wrong type and return error', function () {
    //    assert.equal('"type" must be a string',(msgModule.create([], "testService", process.pid)).details[0].message);
    //});
    //it('Wrong type and return error', function () {
    //    assert.equal('"type" must be a string',(msgModule.create({}, "testService", process.pid)).details[0].message);
    //});

});
