/*global preambleConfig*/
//Preamble 1.0.5
//(c) 2013 Jeffrey Schwartz
//Preamble may be freely distributed under the MIT license.
(function(window, undefined){
    'use strict';

    //Version
    var version = 'v1.0.5';
    //Targeted DOM elements.
    var elPreambleContainer = document.getElementById('preamble-container');
    var elHeader;
    var elStatusContainer;
    var elResults;
    var elUiTestContainer;
    //Default configuration options. Override these in your config file (e.g. var preambleConfig = {asynTestDelay: 20}).
    //shortCircuit: (default false) - set to true to terminate further testing on the first assertion failure.
    //windowGlobals: (default true) - set to false to not use window globals (i.e. non browser environment).
    //asyncTestDelay: (default 500 milliseconds) - set to some other number of milliseconds used to wait for asynchronous tests to complete.
    //asyncBeforeAfterTestDelay: Default value = 500. Set the value used to wait before calling the test's callback (asyncBeforeEachTest) and when calling the next test's callback (asyncAfterEachTest), respectively.
    //name: (default 'Test') - set to a meaningful name.
    //uiTestContainerId (default id="ui-test-container") - set its id to something else if desired.
    var defaultConfig = {shortCircuit: false, windowGlobals: true, asyncTestDelay: 500, asyncBeforeAfterTestDelay: 500, name: 'Test', uiTestContainerId: 'ui-test-container'};
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
    var testIsRunning = false;
    var timerStart;
    var timerEnd;
    //Filters.
    var currentTestStep;
    var groupFilter;
    var testFilter;
    var assertionFilter;

    //Get URL query string param...thanks MDN.
    function loadPageVar (sVar) {
      return decodeURI(window.location.search.replace(new RegExp('^(?:.*[&\\?]' + encodeURI(sVar).replace(/[\.\+\*]/g, '\\$&') + '(?:\\=([^&]*))?)?.*$', 'i'), '$1'));
    }

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
        elStatusContainer.innerHTML = html;
    }

    //Makes words plural if their counts are 0 or greater than 1.
    function pluralize(word, count){
        var pluralizer = arguments === 2 ? arguments[1] : 's';
        return count === 0 ? word + pluralizer : count > 1 ? word + pluralizer : word;
    }

    function stringify(varArg){
        return typeof varArg === 'object' ? JSON.stringify(varArg) : varArg;
    }

    function showTotalsToBeRun(){
        setTimeout(function(){
            var html = '<p>Queues built.</p><p>Running ' + assertionsQueue.length + pluralize(' assertion', assertionsQueue.length) + '/' + totTests + pluralize(' test', totTests) +'/' + totGroups + pluralize(' group', totGroups) + '...</p>';
            elStatusContainer.insertAdjacentHTML('beforeend', html);
        }, 1);
    }

    function deepCopy(arg){
        return JSON.parse(JSON.stringify(arg));
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
    }

    function showResultsSummary(){
        var html;
        //Show elapsed time.
        html = '<p>Tests completed in ' + (timerEnd - timerStart) + ' milliseconds.</p>';
        //Show a summary in the header.
        if(totAssertionsFailed === 0){
            html += '<p class="summary passed">' + totAssertionsPassed + pluralize(' assertion', assertionsQueue.length) + '/' + totTestsPassed + pluralize(' test', totTestsPassed) + '/' + totGroupsPassed + pluralize(' group', totGroupsPassed) + ' passed, 0 tests failed.' + '</p>';
        }else if(totAssertionsPassed === 0){
            html += '<p class="summary failed">0 tests passed, ' + totAssertionsFailed + pluralize(' assertion', totAssertionsFailed) + '/' + totTestsFailed + pluralize(' test', totTestsFailed) + '/' + totGroupsFailed + pluralize(' group', totGroupsFailed)  + ' failed.</p>';
        }else{
            html += '<p class="summary passed">' + totAssertionsPassed + pluralize(' assertion', totAssertionsPassed) + '/' + totTestsPassed + pluralize(' test', totTestsPassed) + '/' + totGroupsPassed + pluralize(' group', totGroupsPassed) + ' passed.</p><p class="summary failed">' + totAssertionsFailed + pluralize(' assertion', totAssertionsFailed) + '/' + totTestsFailed + pluralize(' test', totTestsFailed) + '/' + totGroupsFailed + pluralize(' group', totGroupsFailed) + ' failed.</p>';
        }
        html += '<a href="?">Rerun All Tests</a>';
        elStatusContainer.insertAdjacentHTML('beforeend', html);
    }

    function showAllResults(){
        var groupLabel = '';
        var testLabel = '';
        var html = '';
        elResults.style.display = 'block';
        results.forEach(function(result){
            if(result.testLabel !== testLabel){
                if(html.length){
                    html += '</div>';
                }
            }
            if(result.groupLabel !== groupLabel){
                if(html.length){
                    html += '</div></a>';
                }
            }
            if(result.groupLabel !== groupLabel){
                html += '<div class="group-container"><a class="group" href="?group=' + encodeURI(result.groupLabel) + '">' + result.groupLabel + '</a>';
                groupLabel = result.groupLabel;
            }
            if(result.testLabel !== testLabel){
                html += '<div class="tests-container"><a class="test" href="?group=' + encodeURI(result.groupLabel) + '&test=' + encodeURI(result.testLabel) + '">' + result.testLabel + '</a>';
                testLabel = result.testLabel;
            }
            if(!result.result){
                html += '<div class="assertion-container"><a class="assertion failed" href="?group=' + encodeURI(result.groupLabel) + '&test=' + encodeURI(result.testLabel) + '&assertion=' + encodeURI(result.assertionLabel) + '">"' + result.assertionLabel + '" (' + result.displayAssertionName + ')  failed!"</div>';
            }else{
                html += '<div class="assertion-container"><a class="assertion passed" href="?group=' + encodeURI(result.groupLabel) + '&test=' + encodeURI(result.testLabel) + '&assertion=' + encodeURI(result.assertionLabel) + '">"' + result.assertionLabel + '" (' + result.displayAssertionName + ')  passed!"</div>';
            }
        });
        html += '</div></div>';
        elResults.innerHTML = html;
    }

    function showResults(){
        showResultsSummary();
        showAllResults();
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

    //Assertions.

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

    //Assertion runners.

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
                item.result = item.assertion(typeof item.value === 'function' ? item.value() : item.value, item.expectation);
                if(item.result){
                    totAssertionsPassed++;
                }else{
                    totAssertionsFailed++;
                }
                switch(item.assertion.name){
                    case 'assertIsTrue':
                        item.displayAssertionName = 'isTrue';
                        break;
                    case 'assertIsFalse':
                        item.displayAssertionName = 'isFalse';
                        break;
                    case 'assertEqual':
                        item.displayAssertionName = 'equal';
                        break;
                    case 'assertNotEqual':
                        item.displayAssertionName = 'notEqual';
                        break;
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
        }, 1);
    }

    function pushOntoAssertionQueue(groupLabel, testLabel, assertion, assertionLabel, value, expectation, isAsync){
        assertionsQueue.push({groupLabel: groupLabel, testLabel: testLabel, assertion: assertion, assertionLabel: assertionLabel, value: value, expectation: expectation, isAsync: isAsync});
    }

    function throwException(errMessage){
        throw new Error(errMessage);
    }

    function noteEqualAssertion(value, expectation, label){
        if(assertionFilter === label || assertionFilter === ''){
            if(arguments.length !== 3){
                throwException('Assertion "equal" requires 3 arguments, found ' + arguments.length);
            }
            //Deep copy value and expectation to freeze them against future changes when running an asynchronous test.
            pushOntoAssertionQueue(currentTestHash.groupLabel, currentTestHash.testLabel, assertEqual, label,
                currentTestHash.isAsync ? deepCopy(value) : value, currentTestHash.isAsync ? deepCopy(expectation) : expectation, currentTestHash.isAsync);
        }
    }

    function noteIsTrueAssertion(value, label){
        if(assertionFilter === label || assertionFilter === ''){
            if(arguments.length !== 2){
                throwException('Assertion "isTrue" requires 2 arguments, found ' + arguments.length);
            }
            pushOntoAssertionQueue(currentTestHash.groupLabel, currentTestHash.testLabel, assertIsTrue, label, value, true, currentTestHash.isAsync);
        }
    }

    function noteNotEqualAssertion(value, expectation, label){
        if(assertionFilter === label || assertionFilter === ''){
            if(arguments.length !== 3){
                throwException('Assertion "notEqual" requires 3 arguments, found ' + arguments.length);
            }
            //Deep copy value and expectation to freeze them against future changes when running an asynchronous test.
            pushOntoAssertionQueue(currentTestHash.groupLabel, currentTestHash.testLabel, assertNotEqual, label,
                currentTestHash.isAsync ? deepCopy(value) : value, currentTestHash.isAsync ? deepCopy(expectation) : expectation, currentTestHash.isAsync);
        }
    }

    function noteIsFalseAssertion(value, label){
        if(assertionFilter === label || assertionFilter === ''){
            if(arguments.length !== 2){
                throwException('Assertion "isFalse" requires 2 arguments, found ' + arguments.length);
            }
            pushOntoAssertionQueue(currentTestHash.groupLabel, currentTestHash.testLabel, assertIsFalse, label, value, true, currentTestHash.isAsync);
        }
    }

    //Starts the timer for an async test. When the timeout is triggered it calls
    //callback allowing client to run their assertions. When the callback returns
    //the processing of the next test is set by incrementing testQueueIndex and
    //runTests is called to continue processing the testsQueue.
    function whenAsyncDone(callback){
        setTimeout(function(){
            callback();
            currentTestStep++;
            runTest();
        }, currentTestHash.asyncInterval || config.asyncTestDelay);
    }

    //Runs the current test asynchronously which will call whenAsyncDone (see above).
    function runAsyncTest(){
        if(config.windowGlobals){
            if(currentTestHash.beforeTestVal){
                currentTestHash.testCallback(currentTestHash.beforeTestVal);
            }else{
                currentTestHash.testCallback();
            }
        }else{
            if(currentTestHash.beforeTestVal){
                currentTestHash.testCallback(assert, currentTestHash.beforeTestVal);
            }else{
                currentTestHash.testCallback(assert);
            }
        }
    }

    //Runs the current test synchronously. When the callback returns the
    //processing of the next test is set by incrementing testQueueIndex and
    //runTests is called to continue processing the testsQueue.
    function runSyncTest(){
        if(config.windowGlobals){
            if(currentTestHash.beforeTestVal){
                currentTestHash.testCallback(currentTestHash.beforeTestVal);
            }else{
                currentTestHash.testCallback();
            }
        }else{
            if(currentTestHash.beforeTestVal){
                currentTestHash.testCallback(assert, currentTestHash.beforeTestVal);
            }else{
                currentTestHash.testCallback(assert);
            }
        }
        currentTestStep++;
        runTest();
    }

    //Runs setup synchronously for each test.
    function runBeforeEachSync(){
        currentTestHash.beforeTestVal = currentTestHash.beforeEachTest();
        currentTestStep++;
        runTest();
    }

    //Runs setup asynchronously for each test.
    function runBeforeEachAsync(){
        currentTestHash.beforeTestVal = currentTestHash.asyncBeforeEachTest();
        setTimeout(function(){
            currentTestStep++;
            runTest();
        }, currentTestHash.asyncBeforeTestInterval || config.asyncBeforeAfterTestDelay);
    }

    //Runs tear down synchronously for each test.
    function runAfterEachSync(){
        currentTestHash.afterEachTest();
        currentTestStep++;
        runTest();
    }

    //Runs tear down asynchronously for each test.
    function runAfterEachAsync(){
        currentTestHash.asyncAfterEachTest();
        setTimeout(function(){
            currentTestStep++;
            runTest();
        }, currentTestHash.asyncAfterTestInterval || config.asyncBeforeAfterTestDelay);
    }

    //Runs the 4 steps of a test's life cycle - before each test, test, after each test,
    //and setup next test. The current test is the one pointed to by currentTestHash.
    function runTest(){
        //Run the test life cycle asynchronously so the Browser remains responsive.
        setTimeout(function(){
            switch(currentTestStep){
                case 0: //Runs beforeEach.
                    if(currentTestHash.beforeEachTest){
                        runBeforeEachSync();
                    }else if(currentTestHash.asyncBeforeEachTest){
                        runBeforeEachAsync();
                    }else{
                        currentTestStep++;
                        runTest();
                    }
                    break;
                case 1: //Runs the test.
                    if(currentTestHash.isAsync){
                        runAsyncTest();
                    }else{
                        runSyncTest();
                    }
                    break;
                case 2: //Runs afterEach.
                    if(currentTestHash.afterEachTest){
                        runAfterEachSync();
                    }else if(currentTestHash.asyncAfterEachTest){
                        runAfterEachAsync();
                    }else{
                        currentTestStep++;
                        runTest();
                    }
                    break;
                case 3: //Sets up the processing of the next test to be run.
                    testsQueueIndex++;
                    testIsRunning = false;
                    runTests();
                    break;
            }
        }, 1);
    }

    //Runs each test in testsQueue to build assertionsQueue.
    function runTests(){
        var len = testsQueue.length;
        while(testsQueueIndex < len && !testIsRunning){
            currentTestHash  = testsQueue[testsQueueIndex];
            currentTestStep = 0;
            testIsRunning = true;
            runTest();
        }
        if(testsQueueIndex === len){
            //Run the assertions in the assertionsQueue.
            runAssertions();
        }
    }

    //Note runBeforeEach.
    function beforeEachTest(callback){
        currentTestHash.beforeEachTest = callback;
    }

    //Note asyncRunBeforeEach.
    function asyncBeforeEachTest(callback){
        if(arguments.length === 2){
            currentTestHash.asyncBeforeTestInterval = arguments[0];
            currentTestHash.asyncBeforeEachTest = arguments[1];
        }else{
            currentTestHash.asyncBeforeEachTest = callback;
        }
    }

    //Note runAfterEach.
    function afterEachTest(callback){
        currentTestHash.afterEachTest = callback;
    }

    //Note asyncRunAfterEach.
    function asyncAfterEachTest(callback){
        if(arguments.length === 2){
            currentTestHash.asyncAfterTestInterval = arguments[0];
            currentTestHash.asyncAfterEachTest = arguments[1];
        }
        currentTestHash.asyncAfterEachTest = callback;
    }

    //Provides closure and a label to a group of tests.
    var group = function group(label, callback){
        if(groupFilter === label || groupFilter === ''){
            currentTestHash = {groupLabel: label};
            totGroups++;
            callback();
        }
    };

    //Provides closure and a label to a synchronous test
    //and registers its callback in its testsQueue item.
    var test = function test(label, callback){
        if(testFilter === label || testFilter === ''){
            testsQueue.push(combine(currentTestHash,{testLabel: label, testCallback: callback, isAsync: false}));
            totTests++;
        }
    };

    //Provides closure and a label to an asynchronous test
    //and registers its callback in its testsQueue item.
    //Form: asyncTest(label[, interval], callback).
    var asyncTest = function asyncTest(label){
        if(testFilter === label || testFilter === ''){
            testsQueue.push(combine(currentTestHash, {testLabel: label, testCallback: arguments.length === 3 ? arguments[2] : arguments[1], isAsync: true, asyncInterval: arguments.length === 3 ? arguments[1] : config.asyncTestDelay}));
            totTests++;
        }
    };

    //Shown while the testsQueue is being loaded.
    function showStartMessage(){
        elStatusContainer.innerHTML = '<p>Building queues. Please wait...</p>';
    }

    //Called after the testsQueue has been generated.
    function runner(){
        //Record the start time.
        timerStart = Date.now();
        //Run each test in the testsQueue.
        runTests();
    }

    //Returns the ui test container element.
    function getUiTestContainerElement(){
        return elUiTestContainer;
    }

    //Returns the id of the ui test container element.
    function getUiTestContainerElementId(){
        return config.uiTestContainerId;
    }

    //A factory that creates a proxy wrapper for any function. Use it to
    //determine if the wrapped function was called and how many times
    //it was called. Very useful for testing if asynchronous methods
    //called their callbacks.
    function proxy(){
        var xCalled = 0;
        var fn = function(callback){
            var fnProxy = function(){
                xCalled += 1;
                var args = [].slice.call(arguments);
                return callback.apply(this, args);
            };
            return fnProxy;
        };
        //If you just want to know if the callback was called then
        //call wasCalled with no args. If you want to know if the
        //callback was called n times, pass n as an argument.
        fn.wasCalled = function(){
            return arguments.length === 1 ? arguments[0] === xCalled : xCalled > 0;
        };
        return fn;
    }

    /**
     * It all starts here!!!
     */

    //Capture filters if any.
    groupFilter = loadPageVar('group');
    testFilter = loadPageVar('test');
    assertionFilter = loadPageVar('assertion');

    //Configure the runtime environment.
    configure();

    //Handle global errors.
    window.onerror = errorHandler;

    //Add markup structure to the DOM.
    elPreambleContainer.innerHTML = '<header><h1 id="header"></h1></header><div class="container"><section id="status-container"></section><section id="results-container"></section></div>';

    //Append the ui test container.
    elPreambleContainer.insertAdjacentHTML('afterend', '<div id="' + config.uiTestContainerId + '" class="ui-test-container"></div>');

    //Capture DOM elements for later use.
    elHeader = document.getElementById('header');
    elStatusContainer = document.getElementById('status-container');
    elResults = document.getElementById('results-container');
    elUiTestContainer = document.getElementById(config.uiTestContainerId);

    //Display the name.
    elHeader.innerHTML = config.name;

    //Display the version.
    elHeader.insertAdjacentHTML('afterend', '<small>Preamble ' + version + '</small>');

    //If the windowGlabals config option is false then window globals will
    //not //be used and the one Preamble name space will be used instead.
    if(config.windowGlobals){
        window.group = group;
        window.beforeEachTest = beforeEachTest;
        window.asyncBeforeEachTest = asyncBeforeEachTest;
        window.afterEachTest = afterEachTest;
        window.asyncAfterEachTest = asyncAfterEachTest;
        window.test = test;
        window.asyncTest = asyncTest;
        window.whenAsyncDone = whenAsyncDone;
        window.equal = noteEqualAssertion;
        window.notEqual = noteNotEqualAssertion;
        window.isTrue = noteIsTrueAssertion;
        window.isFalse = noteIsFalseAssertion;
        window.getUiTestContainerElement = getUiTestContainerElement;
        window.getUiTestContainerElementId = getUiTestContainerElementId;
        window.proxy = proxy;
    }else{
        window.Preamble = {
            group: group,
            beforeEachTest: beforeEachTest,
            asyncBeforeEachTest: asyncBeforeEachTest,
            afterEachTest: afterEachTest,
            asyncAfterEachTest: asyncAfterEachTest,
            test: test,
            asyncTest: asyncTest,
            whenAsyncDone: whenAsyncDone,
            getUiTestContainerElement: getUiTestContainerElement,
            getUiTestContainerElementId: getUiTestContainerElementId,
            proxy: proxy
        };
        //Functions to "note" assertions are passed as the
        //1st parameter to each test's callback function.
        assert = {
            equal: noteEqualAssertion,
            notEqual: noteNotEqualAssertion,
            isTrue: noteIsTrueAssertion,
            isFalse: noteIsFalseAssertion
        };
    }

    /**
     * Wait while the testsQueue is loaded.
     */

    //Catch errors.
    try{
        //Show the start message.
        showStartMessage();
        //Build the testsQueue as user calls group, test or asyncTest.
        //Keep checking the testsQueue's length until it is 'stable'.
        //Stable is defined by a time interval during which the length
        //of the testsQueue remains constant, indicating that all tests
        //have been loaded. Once stable, run the tests.
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
