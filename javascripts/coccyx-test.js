(function(window, undefined){
    'use strict';

    //Default configuration options.
    //shortCircuit: (default false) - set to true to terminate further testing on the first assertion failure.
    //windowGlobals: (default true) - set to false to not use window globals (i.e. non browser environment).
    var defaultConfig = {shortCircuit: false, windowGlobals: true};
    //Merged configuration options.
    var config = {};
    var isConfigured = false;
    var queue = [];//Array of callbacks. Calls are sequential. TODO support async.
    var results = [];//Array of results.
    var notedGroup;
    var notedTest;
    var asyncCount = 0;
    var assert;
    var queueCount = 0;
    var queStableCount = 0;
    var queStableInterval = 500;
    var intervalId;
    var totGroups = 0;
    var totGroupsPassed = 0;
    var totGroupsFailed = 0;
    var totTests = 0;
    var totTestsPassed = 0;
    var totTestsFailed = 0;
    var totAssertions = 0;
    var totAssertionsPassed = 0;
    var totAssertionsFailed = 0;
    var isProcessAborted = false;

    //Display caught errors to the browser.
    function errorHandler(){
        var html;
        var $domTarget = $('#header');
        isProcessAborted = true;
        if(arguments.length === 3){
            //window.onerror
            html = '<p>' + arguments[0] + '</p><p>File: ' + arguments[1] + '</p><p>Line: ' + arguments[2] + '</p>';
        }else{
            //catch(e)
            html = '<p>An error occurred,  "' + arguments[0]  + '" and all further processing has been terminated. Please check your browser console for additional details.</p>';
        }
        $domTarget = $('#header');
        $domTarget.html(html);
    }

    //Makes words plural if their counts are 0 or greater than 1.
    function pluralize(word, count){
        var pluralizer = arguments === 2 ? arguments[1] : 's';
        return count === 0 ? word + pluralizer : count > 1 ? word + pluralizer : word;
    }

    function showTotalsToBeRun(){
        var html = '<p>Queue built.</p><p>Running ' + totAssertions + pluralize(' assertion', totAssertions) + '/' + totTests + pluralize(' test', totTests) +'/' + totGroups + pluralize(' group', totGroups) + '...</p>';
        var $domTarget = $('#header');
        $domTarget.html(html);
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
        /* global userConfig */
        config = window.userConfig ? merge(defaultConfig, userConfig) : defaultConfig;
        isConfigured = true;
    }

    function showResultsSummary(){
        var html;
        var $domTarget = $('#header');
        var pre = '<p>Testing has completed.</p>';
        //Show a summary in the header.
        if(totAssertionsFailed === 0){
            html = '<p>' + totAssertionsPassed + pluralize(' assertion', totAssertions) + '/' + totTestsPassed + pluralize(' test', totTestsPassed) + '/' + totGroupsPassed + pluralize(' group', totGroupsPassed) + ' passed, 0 tests failed.' + '</p>';
        }else if(totAssertionsPassed === 0){
            html = '<p> 0 tests passed, ' + totAssertionsFailed + pluralize(' assertion', totAssertionsFailed) + '/' + totTestsFailed + pluralize(' test', totTestsFailed) + '/' + totGroupsFailed + pluralize(' group', totGroupsFailed)  + ' failed.</p>';
        }else{
            html = '<p>' + totAssertionsPassed + pluralize(' assertion', totAssertionsPassed) + '/' + totTestsPassed + pluralize(' test', totTestsPassed) + '/' + totGroupsPassed + pluralize(' group', totGroupsPassed) + ' passed, ' + totAssertionsFailed + pluralize(' assertion', totAssertionsFailed) + '/' + totTestsFailed + pluralize(' test', totTestsFailed) + '/' + totGroupsFailed + pluralize(' group', totGroupsFailed) + ' failed.</p>';
        }
        $domTarget.html(pre + html);
    }

    function showAssertionFailures(){
        //Show failures in the results as a default.
        var $domTarget = $('#results');
        $domTarget.show();
        results.forEach(function(result){
            var html;
            if(!result.result){
                html = '<div class="failed-result">Assertion "' + result.assertionLabel + '" (' + result.assertion.name + ') in test "' + result.testLabel + '", group "' + result.groupLabel + '" failed! Expected assertion to retun"<em>' + (typeof result.expectation === 'object' ? JSON.stringify(result.expectation) : result.expectation) + '</em>" but it returned "' +  (typeof result.result === 'object' ? JSON.stringify(result.result) : result.result) +  '</em>".</div>';
            }
            $domTarget.append(html);
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

    function run(){
        var i,
            len,
            item;
        //Synchronously iterate over the queue, running each item's callback.
        for (i = 0, len = queue.length; i < len; i++) {
            item = queue[i];
            // console.log('Running asserted defined by: ', item);
            item.result = item.assertion(typeof item.value === 'function' ? item.value() : item.value, item.expectation);
            if(item.result){
                totAssertionsPassed++;
            }else{
                totAssertionsFailed++;
            }
            results.push(item);
            if(config.shortCircuit && totAssertionsFailed){
                return;
            }
        }
    }

    function pushOntoQue(groupLabel, testLabel, assertion, assertionLabel, value, expectation){
        queue.push({groupLabel: groupLabel, testLabel: testLabel, assertion: assertion, assertionLabel: assertionLabel, value: value, expectation: expectation});
    }

    function throwMissingArgumentsException(errMessage){
        throw new Error(errMessage);
    }

    function noteEqualAssertion(value, expectation, label){
        if(arguments.length !== 3){
            throwMissingArgumentsException('Assertion "equal" requires 3 arguments, found ' + arguments.length);
        }
        pushOntoQue(notedGroup, notedTest, assertEqual, label, value, expectation);
    }

    function noteIsTrueAssertion(value, label){
        if(arguments.length !== 2){
            throwMissingArgumentsException('Assertion "isTrue" requires 2 arguments, found ' + arguments.length);
        }
        pushOntoQue(notedGroup, notedTest, assertIsTrue, label, value, true);
    }

    function noteNotEqualAssertion(value, expectation, label){
        if(arguments.length !== 3){
            throwMissingArgumentsException('Assertion "notEqual" requires 3 arguments, found ' + arguments.length);
        }
        pushOntoQue(notedGroup, notedTest, assertNotEqual, label, value, expectation);
    }

    function noteIsFalseAssertion(value, label){
        if(arguments.length !== 2){
            throwMissingArgumentsException('Assertion "isFalse" requires 2 arguments, found ' + arguments.length);
        }
        pushOntoQue(notedGroup, notedTest, assertIsFalse, label, value, true);
    }

    //A label for a group of tests.
    //Available in the global name space.
    var group = function group(label, callback){
        // debugger;
        notedGroup = label;
        callback();
        notedGroup = '';
    };

    //Adds tests to the queue to be run once the queue is filled.
    //Available in the global name space.
    var test = function test(label, callback){
        // debugger;
        notedTest = label;
        callback(assert);
    };

    //Called when an asyncTest starts. The queue loading loop
    //enqueue on this until asyncCount is 0.
    var asyncTest = function asyncTest(label, callback){
        //increment async counter
        asyncCount++;
        test(label, callback);
    };

    //Called when an asyncTest is finished to subtract 1
    //from the asyncCount, which is being watched by the
    //queue loading loop.
    var asyncStop = function(){
        asyncCount--;
    };

    //Generate totals from items in the queue for total
    //groups, total tests and total assertions. Totals
    //for passed and failed assertions are generated
    //when later in the process when they are run.
    function genTotalsFromQueue(){
        var prevGroupLabel,
            prevTestLabel;
        queue.forEach(function(item){
            if(item.groupLabel !== prevGroupLabel){
                totGroups++;
                prevGroupLabel = item.groupLabel;
            }
            if(item.testLabel !== prevTestLabel){
                totTests++;
                prevTestLabel = item.testLabel;
            }
            totAssertions++;
        });
    }

    function showStartMessage(){
        var $domTarget = $('#header');
        $domTarget.html('<p>Building queue. Please wait...</p>');
    }

    //Called to begin running the tests in the queue.
    function runner(){
        //Queue totals.
        genTotalsFromQueue();
        //Show queue totals while tests are running.
        if(!isProcessAborted){
            showTotalsToBeRun();
        }
        //Timeout to allow user to see total to be run message.
        setTimeout(function(){
            //Run the tests in the queue.
            run();
            // console.log(results);
            //Report the results.
            reporter();
        }, 2000);
    }

    /**
     * It all starts here!!!
     */

    //Global error handler
    window.onerror = errorHandler;

    //Apply configuration options.
    configure();

    //A small set of window globals to make writing test scripts easier. If
    //the windowGlabals config option is false then window globals will not
    //be used except for the the one CoccyxTest name space which is used
    //to define group and test.
    if(config.windowGlobals){
        window.group = group;
        window.test = test;
        window.asyncTest = asyncTest;
        window.asyncStop = asyncStop;
        window.equal = noteEqualAssertion;
        window.notEqual = noteNotEqualAssertion;
        window.isTrue = noteIsTrueAssertion;
        window.isFalse = noteIsFalseAssertion;
    }else{
        window.CoccyxTest = {
            group: group,
            test: test,
            asyncTest: asyncTest,
            asyncStop: asyncStop
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
            if(queue.length === queueCount && !asyncCount){
                if(queStableCount > 1){
                    clearInterval(intervalId);
                    runner();
                }else{
                    queStableCount++;
                }
            }else{
                queStableCount = 0;
                queueCount = queue.length;
            }
        }, queStableInterval);
    } catch(e) {
        errorHandler(e);
    }
}(window));
