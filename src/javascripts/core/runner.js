/**
 * Internal event handling.
 */
(function(){
    'use strict';
    module.exports.init = function(){
        var on = require('./on.js'),
            emit = require('./emit.js'),
            globals = require('./globals.js'),
            Iterator = require('./iterator.js'),
            Suite = require('./suite.js'),
            Spec = require('./spec.js'),
            tests;

        on('start', function(){
            tests = globals.queue.filter(function(item){
                return item instanceof Spec;
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
                //Suites that haven't run will have their passed property set to true.
                if(queueObj instanceof Suite && queueObj.passed){
                    queueObj.bypass = true;
                    //Tests that havent run do not have a totFailed property.
                } else if(queueObj instanceof Spec && !queueObj.hasOwnProperty(
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
            if(globals.runtimeFilter.suite || globals.config.testingShortCircuited){
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
            globals.reporter.coverage(tests);
            globals.reporter.summary(tests);
            globals.reporter.details(globals.queue);
        });
    };
}());
