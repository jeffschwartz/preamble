/*global preambleConfig*/
//Preamble 1.0.0
//(c) 2013 Jeffrey Schwartz
//Preamble may be freely distributed under the MIT license.
(function(window, undefined){
    'use strict';

    //Targeted DOM elements.
    var elHeader = document.getElementById('header');
    var elResults = document.getElementById('results');
    //Default configuration options.
    //shortCircuit: (default false) - set to true to terminate further testing on the first assertion failure.
    //windowGlobals: (default true) - set to false to not use window globals (i.e. non browser environment).
    //asyncTestDelay: (default 500 milliseconds) - set to some other number of milliseconds used to wait for asynchronous tests to complete.
    var defaultConfig = {shortCircuit: false, windowGlobals: true, asyncPreTestDelay: 500, asyncTestDelay: 500, asyncPostTestDelay: 500, noDom: false};
    //Merged configuration options.
    var config = {};
    var currentTestHash;
    var assertionsQueue = [];//Array of assertions. Calls are sequential. TODO support async.
    var testsQueue = [];//Array of test to be run. It is the first queue to be built!
    var results = [];//Array of results.
    var assert;
    var testsQueueCount = 0;
    var testsQueueStableCount = 0;
    var testsQueueStableInterval = 500;
    var intervalId;
    var totGroups = 0;
    var totGroupsPassed = 0;
    var totGroupsFailed = 0;
    var totTests = 0;
    var totTestsPassed = 0;
    var totTestsFailed = 0;
    var totAssertionsPassed = 0;
    var totAssertionsFailed = 0;
    var isProcessAborted = false;
    var testsQueueIndex = 0;
    var asyncRunning = false;
    var timerStart;
    var timerEnd;
    var currentTestStep;

    //Display caught errors to the browser.
    function errorHandler(){
        var html;
        isProcessAborted = true;
        if(arguments.length === 3){
            //window.onerror
            html = '<p>' + arguments[0] + '</p><p>File: ' + arguments[1] + '</p><p>Line: ' + arguments[2] + '</p>';
        }else{
            //catch(e)
            html = '<p>An error occurred,  "' + arguments[0]  + '" and all further processing has been terminated. Please check your browser console for additional details.</p>';
        }
        elHeader.innerHTML = html;
    }

    //Makes words plural if their counts are 0 or greater than 1.
    function pluralize(word, count){
        var pluralizer = arguments === 2 ? arguments[1] : 's';
        return count === 0 ? word + pluralizer : count > 1 ? word + pluralizer : word;
    }

    function showTotalsToBeRun(){
        var html = '<p>Queues built.</p><p>Running ' + assertionsQueue.length + pluralize(' assertion', assertionsQueue.length) + '/' + totTests + pluralize(' test', totTests) +'/' + totGroups + pluralize(' group', totGroups) + '...</p>';
        elHeader.insertAdjacentHTML('beforeend', html);
    }

    function combine(){
        var result = {};
        var sources = [].slice.call(arguments, 0);
        sources.forEach(function(source){
            var prop;
            for(prop in source){
                if(source.hasOwnProperty(prop)){
                    result[prop] = source[prop];
                }
            }
        });
        return result;
    }

    function merge(){
        var result = {};
        var target = arguments[0];
        var sources = [].slice.call(arguments, 1);
        sources.forEach(function(source){
            var prop;
            for(prop in target){
                if(target.hasOwnProperty(prop)){
                    result[prop] = source.hasOwnProperty(prop) ? source[prop] : target[prop];
                }
            }
        });
        return result;
    }

    //Configuration
    function configure(){
        config = window.preambleConfig ? merge(defaultConfig, preambleConfig) : defaultConfig;
        //Check the DoM for a div with an id of 'preamble-container'.
        if(!document.getElementById('preamble-container')){
            config.noDom = true;
        }
    }

    function showResultsSummary(){
        var html;
        //Show elapsed time.
        html = '<p>Tests completed in ' + (timerEnd - timerStart) + ' milliseconds.</p>';
        //Show a summary in the header.
        if(totAssertionsFailed === 0){
            html += '<p>' + totAssertionsPassed + pluralize(' assertion', assertionsQueue.length) + '/' + totTestsPassed + pluralize(' test', totTestsPassed) + '/' + totGroupsPassed + pluralize(' group', totGroupsPassed) + ' passed, 0 tests failed.' + '</p>';
        }else if(totAssertionsPassed === 0){
            html += '<p> 0 tests passed, ' + totAssertionsFailed + pluralize(' assertion', totAssertionsFailed) + '/' + totTestsFailed + pluralize(' test', totTestsFailed) + '/' + totGroupsFailed + pluralize(' group', totGroupsFailed)  + ' failed.</p>';
        }else{
            html += '<p>' + totAssertionsPassed + pluralize(' assertion', totAssertionsPassed) + '/' + totTestsPassed + pluralize(' test', totTestsPassed) + '/' + totGroupsPassed + pluralize(' group', totGroupsPassed) + ' passed, ' + totAssertionsFailed + pluralize(' assertion', totAssertionsFailed) + '/' + totTestsFailed + pluralize(' test', totTestsFailed) + '/' + totGroupsFailed + pluralize(' group', totGroupsFailed) + ' failed.</p>';
        }
        elHeader.insertAdjacentHTML('beforeend', html);
    }

    function showAssertionFailures(){
        //Show failures in the results as a default.
        elResults.style.display = 'block';
        results.forEach(function(result){
            var html;
            if(!result.result){
                html = '<div class="failed-result">Assertion "' + result.assertionLabel + '" (' + result.assertion.name + ') in test "' + result.testLabel + '", group "' + result.groupLabel + '" failed! Expected assertion to return"<em>' + (typeof result.expectation === 'object' ? JSON.stringify(result.expectation) : result.expectation) + '</em>" but it returned "' +  (typeof result.result === 'object' ? JSON.stringify(result.result) : result.result) +  '</em>".</div>';
                elResults.insertAdjacentHTML('beforeend', html);
            }
        });
    }

    function showResults(){
        showResultsSummary();
        if(totAssertionsFailed){
            showAssertionFailures();
        }
    }

    function genTotalsFromResults(){
        var prevGroupLabel;
        var prevTestLabel;
        results.forEach(function(result){
            if(!result.result){
                if(result.groupLabel !== prevGroupLabel){
                    totGroupsFailed++;
                    prevGroupLabel = result.groupLabel;
                }
                if(result.testLabel !== prevTestLabel){
                    totTestsFailed++;
                    prevTestLabel = result.testLabel;
                }
            }
        });
        totTestsPassed = totTests - totTestsFailed;
        totGroupsPassed = totGroups - totGroupsFailed;
    }

    function reporter(){
        genTotalsFromResults();
        if(!isProcessAborted){
            showResults();
        }
    }

    function compareArrays(a, b){
        var i,
            len;
        if(Array.isArray(a) && Array.isArray(b)){
            if(a.length !== b.length){
                return false;
            }
            for(i = 0, len = a.length; i < len; i++){
                if(typeof a[i] === 'object' && typeof b[i] === 'object'){
                    if(!compare(a[i], b[i])){
                        return false;
                    }
                    continue;
                }
                if(typeof a[i] === 'object' || typeof b[i] === 'object'){
                    return false;
                }
                if(Array.isArray(a[i]) && Array.isArray(b[i])){
                    if(!compareArrays(a[i], b[i])){
                        return false;
                    }
                    continue;
                }
                if(Array.isArray(a[i]) || Array.isArray(b[i])){
                    return false;
                }
                if(a[i] !== b[i]){
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    function compareObjects(a, b){
        var prop;
        if(compareArrays(a, b)){
            return true;
        }
        for(prop in a){
            if(a.hasOwnProperty(prop) && b.hasOwnProperty(prop)){
                if(typeof a[prop] === 'object' && typeof b[prop] === 'object'){
                    if(!compareObjects(a[prop], b[prop])){
                        return false;
                    }
                    continue;
                }
                if(typeof a[prop] === 'object' || typeof b[prop] === 'object'){
                    return false;
                }
                if(a[prop] !== b[prop]){
                    return false;
                }
            }else {
                return false;
            }
        }
        return true;
    }

    function compare(a, b){
        return compareObjects(a, b) && compareObjects(b, a);
    }

    //Assertions

    function a_equals_b(a, b){
        if(typeof a ==='object' && typeof b === 'object'){
            //Both are object so compare their properties.
            if(compare(a,b)){
                return true;
            }
        }
        if(typeof a === 'object'|| typeof b === 'object'){
            //One is an object and the other isn't.
            return false;
        }
        //Both are not object so just compare values.
        return a === b;
    }

    function a_notequals_b(a, b){
        return !a_equals_b(a, b);
    }

    //Simple boolean test.
    function a_equals_true(a){
        return a === true;
    }

    //Simple boolean test.
    function a_equals_false(a){
        return !a_equals_true(a);
    }

    //assertion runner

    // a === b
    function assertEqual(a, b){
        return a_equals_b(a, b);
    }

    // a === true, simple boolean test
    function assertIsTrue(a){
        return a_equals_true(a);
    }

    // a !== b
    function assertNotEqual(a, b){
        return a_notequals_b(a, b);
    }

    // a === false, simple boolean test
    function assertIsFalse(a){
        return a_equals_false(a);
    }

    //Loops through the assertionsQueue, running each assertion and records the results.
    function runAssertions(){
        var i,
            len,
            item;
        //Show totals for groups, test, assertions before running the tests.
        showTotalsToBeRun();
        //A slight delay so user can see the totals and they don't flash.
        setTimeout(function(){
            //Synchronously iterate over the assertionsQueue, running each item's assertion.
            for (i = 0, len = assertionsQueue.length; i < len; i++) {
                item = assertionsQueue[i];
                // console.log('Running asserted defined by: ', item);
                item.result = item.assertion(typeof item.value === 'function' ? item.value() : item.value, item.expectation);
                if(item.result){
                    totAssertionsPassed++;
                }else{
                    totAssertionsFailed++;
                }
                results.push(item);
                if(config.shortCircuit && totAssertionsFailed){
                    reporter();
                    return;
                }
            }
            //Record the end time.
            timerEnd = Date.now();
            //Report the results.
            reporter();
        }, 2000);
    }

    function pushOntoAssertionQueue(groupLabel, testLabel, assertion, assertionLabel, value, expectation, isAsync){
        assertionsQueue.push({groupLabel: groupLabel, testLabel: testLabel, assertion: assertion, assertionLabel: assertionLabel, value: value, expectation: expectation, isAsync: isAsync});
    }

    function throwException(errMessage){
        throw new Error(errMessage);
    }

    function noteEqualAssertion(value, expectation, label){
        if(arguments.length !== 3){
            throwException('Assertion "equal" requires 3 arguments, found ' + arguments.length);
        }
        pushOntoAssertionQueue(currentTestHash.groupLabel, currentTestHash.testLabel, assertEqual, label, value, expectation, currentTestHash.isAsync);
    }

    function noteIsTrueAssertion(value, label){
        if(arguments.length !== 2){
            throwException('Assertion "isTrue" requires 2 arguments, found ' + arguments.length);
        }
        pushOntoAssertionQueue(currentTestHash.groupLabel, currentTestHash.testLabel, assertIsTrue, label, value, true, currentTestHash.isAsync);
    }

    function noteNotEqualAssertion(value, expectation, label){
        if(arguments.length !== 3){
            throwException('Assertion "notEqual" requires 3 arguments, found ' + arguments.length);
        }
        pushOntoAssertionQueue(currentTestHash.groupLabel, currentTestHash.testLabel, assertNotEqual, label, value, expectation, currentTestHash.isAsync);
    }

    function noteIsFalseAssertion(value, label){
        if(arguments.length !== 2){
            throwException('Assertion "isFalse" requires 2 arguments, found ' + arguments.length);
        }
        pushOntoAssertionQueue(currentTestHash.groupLabel, currentTestHash.testLabel, assertIsFalse, label, value, true, currentTestHash.isAsync);
    }

    //Starts the timer for an async test. When the timeout is triggered it calls
    //callback allowing client to run their assertions. When the callback returns
    //the processing of the next test is set by incrementing testQueueIndex and
    //runTests is called to continue processing the testsQueue.
    function whenAsyncStopped(callback){
        // currentTestHash.whenAsyncStopped = callback;
        setTimeout(function(){
            callback();
            asyncRunning = false;
            testsQueueIndex++;
            runTests();
        }, currentTestHash.asyncInterval || config.asyncTestDelay);
    }

    //Halts the processing of the testsQueue and call the current test's callback.
    //See whenAsyncStopped.
    function runAsyncTest(){
        asyncRunning = true;
        currentTestHash.testCallback(assert);
    }

    //Runs the current test synchronously.
    function runSyncTest(){
        currentTestHash.testCallback(assert);
        testsQueueIndex++;
    }

    //Runs setup synchronously for each test.
    function runBeforeEachSync(){
        currentTestHash.beforeEach();
        currentTestStep++;
        runTest();
    }

    //Runs setup asynchronously for each test.
    function runBeforeEachAsync(){
        currentTestHash.runBeforeEachAsync();
        setTimeout(function(){
            currentTestStep++;
            runTest();
        }, currentTestHash.asyncInterval || config.asyncTestDelay);
    }

    //Runs tear down synchronously for each test.
    function runAfterEachSync(){
        currentTestHash.afterEach();
        currentTestStep++;
        runTest();
    }

    //Runs tear down asynchronously for each test.
    function runAfterEachAsync(){
        currentTestHash.runAfterEachAsync();
        setTimeout(function(){
            currentTestStep++;
            runTest();
        }, currentTestHash.asyncInterval || config.asyncTestDelay);
    }

    function runTest(){
        setTimeout(function(){
            switch(currentTestStep){
                case 0:
                    if(currentTestHash.beforeEachTest){
                        runBeforeEachSync();
                    }else if(currentTestHash.beforeEachTestAsync){
                        runBeforeEachAsync();
                    }
                    break;
                case 1:
                    if(currentTestHash.isAsync){
                        runAsyncTest();
                    }else{
                        runSyncTest();
                    }
                    break;
                case 2:
                    if(currentTestHash.afterEachTest){
                        runAfterEachSync();
                    }else if(currentTestHash.afterEachTestAsync){
                        runAfterEachAsync();
                    }
                    break;
                case 3:
                    break;
            }
        }, 1);
    }

    //Runs each test in testsQueue to build assertionsQueue. When a test
    //is run asynchronously (asyncTest) runTests terminates to prevent
    //further processing of tests in the testsQueue until after the
    //asynchronous test has completed. When the asynchronous test signals
    //that it is done by calling asyncStop, the asyncRunning flag is
    //set to false and runTests is called again, picking up at the next
    //test in the testsQueue.
    function runTests(){
        var len = testsQueue.length;
        while(testsQueueIndex < len && !asyncRunning){
            currentTestHash  = testsQueue[testsQueueIndex];
            currentTestStep = 0;
            if(currentTestHash.isAsync){
                runAsyncTest();
            }else{
                runSyncTest();
            }
        }
        if(testsQueueIndex === len){
            //Run the assertions in the assertionsQueue.
            runAssertions();
        }
    }

    //A label for a group of tests.
    //Available in the global name space.
    var group = function group(label, callback){
        currentTestHash = {groupLabel: label};
        totGroups++;
        callback();
    };

    //Adds tests to the queue to be run once the queue is filled.
    var test = function test(label, callback){
        testsQueue.push(combine(currentTestHash,{testLabel: label, testCallback: callback, isAsync: false}));
        totTests++;
    };

    //Adds asynchronous tests to the queue like test except it marks the hash param 'isAsync' as true.
    //Forms: asyncTest(label[, interval], callback).
    var asyncTest = function asyncTest(label){
        testsQueue.push(combine(currentTestHash, {testLabel: label, testCallback: arguments.length === 3 ? arguments[2] : arguments[1], isAsync: true, asyncInterval: arguments.length === 3 ? arguments[1] : config.asyncTestDelay}));
        totTests++;
    };

    function showStartMessage(){
        elHeader.innerHTML = '<p>Building queues. Please wait...</p>';
    }

    //Called after the testsQueue has been generated.
    function runner(){
        //Timeout to allow user to see total to be run message.
        setTimeout(function(){
            //Build assertionQueue.
            runTests();
        }, 2000);
    }

    /**
     * It all starts here!!!
     */

    //Configure the runtime environment.
    configure();

    //Global error handler
    window.onerror = errorHandler;

    //A small set of window globals to make writing test scripts easier. If
    //the windowGlabals config option is false then window globals will not
    //be used except for the the one Preamble name space which is used
    //to define group and test.
    if(config.windowGlobals){
        window.group = group;
        window.test = test;
        window.asyncTest = asyncTest;
        window.whenAsyncStopped = whenAsyncStopped;
        window.equal = noteEqualAssertion;
        window.notEqual = noteNotEqualAssertion;
        window.isTrue = noteIsTrueAssertion;
        window.isFalse = noteIsFalseAssertion;
    }else{
        window.Preamble = {
            group: group,
            test: test,
            asyncTest: asyncTest,
            whenAsyncStopped: whenAsyncStopped,
        };
        //Passed to test's callbacks. Not the real ones, instead
        //the ones that will further update their quue entries.
        assert = {
            equal: noteEqualAssertion,
            notEqual: noteNotEqualAssertion,
            isTrue: noteIsTrueAssertion,
            isFalse: noteIsFalseAssertion
        };
    }

    //Catch errors.
    try{
        //Record the start time.
        timerStart = Date.now();
        //Show the start message.
        showStartMessage();
        //Build the queue as user calls group or test.
        //Keep checking the queue until it is 'stable'. Stable
        //is defined by a time interval during which the length
        //of the queue remains constant and there are no asynchronous
        //tests running, indicating that all tests have been
        //loaded. Once stable, run the tests.
        // debugger;
        intervalId = setInterval(function(){
            if(testsQueue.length === testsQueueCount){
                if(testsQueueStableCount > 1){
                    clearInterval(intervalId);
                    runner();
                }else{
                    testsQueueStableCount++;
                }
            }else{
                testsQueueStableCount = 0;
                testsQueueCount = testsQueue.length;
            }
        }, testsQueueStableInterval);
    } catch(e) {
        errorHandler(e);
    }
}(window));
