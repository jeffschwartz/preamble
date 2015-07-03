//Preamble v3.0.3)
//(c) 2013 - 2015 Jeffrey Schwartz
//Preamble may be freely distributed under the MIT license.
(function(window, undefined){
    'use strict';

    //Version
    var prevQueueCount = 0,
        queueStableCount = 0,
        queueStableInterval = 1,
        // reFileFromStackTrace = /file:\/\/\/\S+\.js:[0-9]+[:0-9]*/g,
        reporter,
        intervalId,
        tests,
        //TODO(JS): requires that eventually may not be needed to be declared here
        Iterator = require('./core/iterator.js'),
        Group = require('./core/group.js'),
        Test = require('./core/test.js'),
        HtmlReporter = require('./reporters/htmlreporter.js'),
        emit = require('./core/emit.js'),
        on = require('./core/on.js'),
        configure = require('./core/configure.js'),
        globals = require('./core/globals.js'),
        helpers = require('./core/helpers.js');

    /**
     * Polyfil for bind - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
     * Required when using phantomjs - its javascript vm doesn't currently support Function.prototype.bind.
     * TODO(Jeff): remove polyfil once phantomjs supports bind!
     */
    if(!Function.prototype.bind){
        Function.prototype.bind = function(oThis){
            if(typeof this !== 'function'){
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable'
                );
            }
            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                FNOP = function(){},
                fBound = function(){
                    return fToBind.apply(this instanceof FNOP && oThis ? this :
                        oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
                };
            FNOP.prototype = this.prototype;
            fBound.prototype = new FNOP();
            return fBound;
        };
    }

    /**
     * Internal event handling.
     */

    //Initialize.
    on('start', function(){
        tests = globals.queue.filter(function(item){
            return item instanceof Test;
        });
        tests.result = true;
        tests.totTestsFailed = 0;
        if(tests.length){
            emit('runTests', function(){
                emit('end');
            });
        } else {
            //TODO(Jeff): perhaps this should display a message that there are no tests to run.
            emit('end');
        }
    });

    on('runTests', function(topic, callback){
        globals.testsIterator = new Iterator(tests);

        function runTest(test, callback){
            if(test.bypass){
                callback();
            } else {
                test.run(function(){
                    //Pass the totFailed value for the test
                    //back so that it and shortCircuit can
                    //be analyzed to determine if testing
                    //needs to be aborted.
                    callback(test.totFailed);
                });
            }
        }

        function runTests(callback){
            if(globals.testsIterator.hasNext()){
                runTest(globals.testsIterator.getNext(), function(totFailed){
                    if(totFailed && globals.config.shortCircuit){
                        //If totFailed and shortCircuit then abort
                        //further testing!
                        emit('testingShortCircuited');
                        callback();
                    } else {
                        runTests(callback);
                    }
                });
            } else {
                callback();
            }
        }

        runTests(function(){
            callback();
        });
    });

    on('testingShortCircuited', function(){
        //Set the "bypass" property for all groups and
        //tests that arent related to this test to true.
        var queueIterator, queueObj;
        queueIterator = new Iterator(globals.queue);
        while (queueIterator.hasNext()){
            queueObj = queueIterator.getNext();
            //Groups that haven't run will have their passed property set to true.
            if(queueObj instanceof Group && queueObj.passed){
                queueObj.bypass = true;
                //Tests that havent run do not have a totFailed property.
            } else if(queueObj instanceof Test && !queueObj.hasOwnProperty(
                    'totFailed')){
                queueObj.bypass = true;
            }
        }
        //Set flag in config to indicate that testing has
        //been aborted due to short circuit condition.
        globals.config.testingShortCircuited = true;
    });

    on('end', function(){
        //Record how many tests were bypassed.
        tests.totBypassed = 0;
        if(globals.runtimeFilter.group || globals.config.testingShortCircuited){
            tests.totBypassed = tests.reduce(function(prevValue, t){
                return t.bypass ? prevValue + 1 : prevValue;
            }, 0);
        }
        //Record how many tests failed.
        tests.totTestsFailed = tests.reduce(function(prevValue, t){
            return t.timedOut || t.totFailed ? prevValue +
                1 : prevValue;
        }, 0);
        tests.result = tests.totTestsFailed === 0;
        globals.queue.end = Date.now();
        tests.duration = globals.queue.end - globals.queue.start;
        reporter.coverage(tests);
        reporter.summary(tests);
        reporter.details(globals.queue);
    });

    /**
     * It all starts here!
     */

    //Record the start time.
    globals.queue.start = Date.now();

    //Create a reporter.
    reporter = new HtmlReporter();

    //Configure the runtime environment.
    configure();

    /**
     * Wait while the queue is loaded.
     */
    try {
        //Wait while the queue is built as scripts call group function.
        //Keep checking the queue's length until it is 'stable'.
        //Keep checking that config.autoStart is true.
        //Stable is defined by a time interval during which the length
        //of the queue remains constant, indicating that all groups
        //have been loaded. Once stable, emit the 'start' event.
        //***Note: config.autoStart can only be false if it set by an
        //external process (e.g. Karma adapter).
        //TODO(Jeff): handle a missing test script
        intervalId = setInterval(function(){
            if(globals.queue.length === prevQueueCount){
                if(queueStableCount > 1 && globals.config.autoStart){
                    clearInterval(intervalId);
                    //Run!
                    emit('start');
                } else {
                    queueStableCount++;
                }
            } else {
                queueStableCount = 0;
                prevQueueCount = globals.queue.length;
            }
        }, queueStableInterval);
    } catch (e){
        helpers.errorHandler(e);
    }
}(window));
