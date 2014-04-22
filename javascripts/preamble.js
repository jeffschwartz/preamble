//Preamble 2.0.0
//(c) 2013 Jeffrey Schwartz
//Preamble may be freely distributed under the MIT license.
(function(window, undefined){
    'use strict';

    //Version
    var version = 'v2.0.0',
        /**
         *Default configuration options - override these in your config file (e.g. var preambleConfig = {asyncTestDelay: 20})
         *or in-line in your tests.
         *
         *shortCircuit: (default false) - set to true to terminate further testing on the first assertion failure.
         *
         *windowGlobals: (default true) - set to false to not use window globals (i.e. non browser environment). *IMPORTANT - 
         *USING IN-LINE CONFIGURATION TO OVERRIDE THE "windowGlobals" OPTION IS NOT SUPPORTED.
         *
         *asyncTestDelay: (default 10 milliseconds) - set to some other number of milliseconds used to wait for asynchronous 
         *tests to complete.
         *
         *asyncBeforeAfterTestDelay: (default 10 milliseconds) Set the value used to wait before calling the test's callback 
         *(asyncBeforeEachTest) and when calling the next test's callback (asyncAfterEachTest), respectively.
         *
         *name: (default 'Test') - set to a meaningful name.
         *
         *uiTestContainerId (default id="ui-test-container") - set its id to something else if desired.
         *
         *hidePassedGroups: (default: false) - v2.0.0 set to true to hide passed groups.
         *
         *filters: (default: []) - v2.0.0 set 1 or more filters by adding hashes, e.g. {group: groupLabel, test: testLabel, 
         *assertion: assertionLabel}.You can also use the wildcard '*' character for test and/or assertions to specify that 
         *all tests and/or all assertions, respectively, should be included in the filter.
         *
         *autoStart: (default: true) - *IMPORTANT - FOR INTERNAL USE ONLY. Adapters for external processes, such as for Karma, 
         *initially set this to false to delay the execution of the tests and will eventually set it to true when appropriate.
         */
        defaultConfig = {
            shortCircuit: false, 
            windowGlobals: true, 
            asyncTestDelay: 10, 
            asyncBeforeAfterTestDelay: 10, 
            name: 'Test', 
            uiTestContainerId: 'ui-test-container', 
            hidePassedGroups: false,
            filters: [],
            autoStart: true
        },
        //Merged configuration options.
        config = {},
        //v2.0.0
        queue=[],
        //v2.0.0 Can only be true if config.shortCircuit is true and an assertion has failed.
        isShortCircuited = false,
        currentTestHash,
        assert,
        //v2.0.0
        prevQueueCount = 0,
        //v2.0.0
        queueStableCount = 0,
        //v2.0.0
        queueStableInterval = 1,
        intervalId,
        currentTestStep,
        //v2.0.0 Run-time filter
        runtimeFilter,
        //v.2.0.0 The stack trace property used by the browser.
        stackTraceProperty,
        //v.2.0.0 RegEx for getting file from stack trace.
        reFileFromStackTrace = /file:\/\/\/\S+\.js:[0-9]+[:0-9]*/g,
        //v2.0.0
        currentGroupIndex,
        currentTestIndex;

    //Get URL query string param...thanks MDN.
    function loadPageVar (sVar) {
        return decodeURI(window.location.search.replace(new RegExp('^(?:.*[&\\?]' + encodeURI(sVar).replace(/[\.\+\*]/g, '\\$&') + 
            '(?:\\=([^&]*))?)?.*$', 'i'), '$1'));
    }

    //Display caught errors to the browser.
    function errorHandler(){
        var html;
        //isProcessAborted = true;
        if(arguments.length === 3){
            //window.onerror
            html = '<p class="failed">' + arguments[0] + '</p><p>File: ' + arguments[1] + '</p><p>Line: ' + arguments[2] + '</p>';
            //v2.0.0 For external reporting.
            publishStatusUpdate({
                status: 'error',
                error: arguments[0] + '. File: ' + arguments[1] + '. Line: ' + arguments[2]
            });
        }else{
            //catch(e)
            html = '<p class="failed">An error occurred,  "' + arguments[0] + 
                '" and all further processing has been terminated. Please check your browser console for additional details.</p>';
            //v2.0.0 For external reporting.
            publishStatusUpdate({
                status: 'error',
                error: 'An error occurred, "' + arguments[0] + 
                    '" and all further processing has been terminated. Please check your browser console for additional details.</p>'
            });
        }
        document.getElementById('preamble-status-container').innerHTML = html;
    }

    //Makes words plural if their counts are 0 or greater than 1.
    function pluralize(word, count){
        var pluralizer = arguments === 2 ? arguments[1] : 's';
        return count === 0 ? word + pluralizer : count > 1 ? word + pluralizer : word;
    }

    function deepCopy(arg){
        return JSON.parse(JSON.stringify(arg));
    }

    function combine(){
        var result = {},
            sources = [].slice.call(arguments, 0);
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
        var result = {},
            target = arguments[0],
            sources = [].slice.call(arguments, 1);
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

    function wrapStringWith(wrapChar, string){
        return wrapChar + string + wrapChar;
    }

    function doubleQuote(string){
        return wrapStringWith('"', string);
    }

    //v2.0.0 Adds an event handle to a DOM element for an event in a cross-browser compliant manner.
    function domAddEventHandler(el, event, handler){
        if( el.addEventListener){
            el.addEventListener(event, handler);
        }else{
            el.attachEvent('on' + event, handler);
        }
    }

    //v2.0.0 Click event handler for the hidePassedGroups checkbox.
    function hpgClickHandler(){
        var elDivs = document.getElementsByTagName('div'),
            i,
            ii,
            l,
            ll,
            attributes,
            elContainers = [],
            classes = '';
        for(i = 0, l= elDivs.length; i < l; i++){
            attributes = elDivs[i].getAttribute('class');
            if(attributes && attributes.length){
                attributes = attributes.split(' ');
                for(ii = 0, ll = attributes.length; ii < ll; ii++){
                    if(attributes[ii] === 'group-container' || attributes[ii] === 'tests-container' || attributes[ii] === 'assertion-container'){
                        elContainers.push(elDivs[i]);
                    }
                }
            }
        }
        if(document.getElementById('hidePassedGroups').checked){
            elContainers.forEach(function(elContainer){
                if(elContainer.getAttribute('data-passed') === 'true'){
                    classes = elContainer.getAttribute('class');
                    elContainer.setAttribute('class', classes + ' hidden');
                }
            });
        }else{
            elContainers.forEach(function(elContainer){
                if(elContainer.getAttribute('data-passed') === 'true'){
                    classes = elContainer.getAttribute('class');
                    attributes = classes.split(' ');
                    classes = [];
                    attributes.forEach(function(c){
                        if(c !== 'hidden'){
                            classes.push(c);
                        }
                    });
                    elContainer.setAttribute('class', classes);
                }
            });
        }
    }

    //v2.0.0 When the anchor tag "run all" is clicked, persist the hidePassedGroups checkbox state as a query parameter.
    function runAllClickHandler(evt){
        var checked = document.getElementById('hidePassedGroups').checked,
            href;
        if(config.hidePassedGroups !== checked){
            evt.preventDefault();
            href = evt.currentTarget.getAttribute('href');
            window.location = href + (href[href.length -1] === '?' ? '' : '&') + 'hpg=' + checked;
        }
    }

    //v2.0.0 Filtering.
    function filter(level, labels){
        //If there are no runtime and configuration filters then return true.
        if(!runtimeFilter.group && !config.filters.length){
            return true;
        }
        //Check if there is a run-time filter first, because it takes precendence over configuration filters
        if(runtimeFilter.group){
            switch(level){
                case 'group':
                    return runtimeFilter.group === labels.group;
                case 'test':
                    return runtimeFilter.group === labels.group && (runtimeFilter.test === '' || runtimeFilter.test === labels.test);
                case 'assertion':
                    return runtimeFilter.group === labels.group && (runtimeFilter.test === '' || runtimeFilter.test === labels.test) && 
                        (runtimeFilter.assertion === '' || runtimeFilter.assertion === labels.assertion);
            }
        }else{
            switch(level){
                case 'group':
                    return config.filters.some(function(fltr){
                        return fltr.group === labels.group;
                    });
                case 'test':
                    return config.filters.some(function(fltr){
                        return fltr.group === labels.group && (fltr.test === '*' || fltr.test === labels.test);
                    });
                case 'assertion':
                    return config.filters.some(function(fltr){
                        return fltr.group === labels.group && (fltr.test === '*' || fltr.test === labels.test) && 
                            (fltr.assertion === '*' || fltr.assertion === labels.assertion);
                    });
            }
        }
    }

    //Configuration
    //v2.0.0 Support for in-line configuration.
    //Called once internally but may be called again if test script calls it.
    function configure(){
        //v2.0.0
        var configArg = arguments && arguments[0],
            s;
        //Ignore configuration once testing has started.
        if(configArg && queue.length){
            alert('no no no!');
            return;
        }
        config = window.preambleConfig ? merge(defaultConfig, window.preambleConfig) : defaultConfig;
        config = configArg ? merge(config, configArg) : config;
        //Totals
        queue.totTests = 0;
        queue.totAssertions = 0;
        //Capture run-time filters, if any. Run-time filters take precedent over configuration filters.
        runtimeFilter = {group: loadPageVar('group'), test: loadPageVar('test'), assertion: loadPageVar('assertion')};
        //v2.0.0 Capture exception's stack trace property.
        setStackTraceProperty();
        //Handle global errors.
        window.onerror = errorHandler;
        //Add markup structure to the DOM.
        s = '<header>' + 
            '<div class="banner"><h1><span id="name">{{name}}</span> - <span><i>Preamble</i><span> <span><i id="version">{{version}}</i></span></h1></div>' + 
            '<div id="time"><span>Completed in <span title="total test time/total elapsed time">{{tt}}ms/{{et}}ms</span></div>' +
            '</header>' +
            '<div class="container">' + '<section id="preamble-status-container">' + '<div class="summary">Building queue. Please wait...</div>' + '</section>' + 
            '<section id="preamble-results-container"></section></div>';
        //Set the config name.
        s = s.replace(/{{name}}/, config.name);
        //Set the version.
        s = s.replace(/{{version}}/, version);
        document.getElementById('preamble-test-container').innerHTML = s;
        //Append the ui test container.
        document.getElementById('preamble-ui-container').innerHTML = '<div id="' + config.uiTestContainerId + '" class="ui-test-container"></div>';
        //If the windowGlabals config option is false then window globals will
        //not be used and the one Preamble name space will be used instead.
        if(config.windowGlobals){
            window.configure = configure;
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
            window.isTruthy = noteIsTruthyAssertion;
            window.isNotTruthy = noteIsNotTruthyAssertion;
            window.getUiTestContainerElement = getUiTestContainerElement;
            window.getUiTestContainerElementId = getUiTestContainerElementId;
            window.proxy = proxy;
        }else{
            window.Preamble = {
                configure: configure,
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
                isFalse: noteIsFalseAssertion,
                isTruthy: noteIsTruthyAssertion,
                isNotTruthy: noteIsNotTruthyAssertion
            };
        }
        //v2.0.0 For external reporting.
        window.Preamble = window.Preamble || {};
        window.Preamble.__ext__ = {};
        /**
         * v2.0.0 For external reporting.
         * Expose config options.
         */
        window.Preamble.__ext__.config = config;
    }

    function showResultsSummary(){
        var html,
            el,
            s,
            totGroups = queue.length,
            totGroupsPassed = queue.length - queue.totGroupsFailed,
            totTestsPassed = queue.totTests - queue.totTestsFailed,
            totAssertionsPassed = queue.totAssertions - queue.totAssertionsFailed;
        
        el = document.getElementById('time');
        s = el.innerHTML;
        s = s.replace(/{{tt}}/, queue.duration);
        s = s.replace(/{{et}}/, queue.totalElapsedTime);
        el.innerHTML = s;
        el.style.display = 'block';
        //v2.0.0 Show coverage.
        showCoverage();
        if(queue.result){
            html = '<div id="preamble-results-summary-passed" class="summary-passed">' + totGroups +
                pluralize(' group', totGroups) + '/' + queue.totTests+ pluralize(' test', queue.totTests) + '/' +
                queue.totAssertions + pluralize(' assertion', queue.totAssertions) + ' passed' + '</div>';
        }else if(totAssertionsPassed === 0){
            html = '<div id="preamble-results-summary-failed" class="summary-failed">' + queue.totGroupsFailed +
                pluralize(' group', queue.totGroupsFailed) + '/' + queue.totTestsFailed + pluralize(' test', queue.totTestsFailed) + '/' +
                queue.totAssertionsFailed + pluralize(' assertion', queue.totAssertionsFailed) + ' failed.</div>';
        }else{
            html = '<div id="preamble-results-summary-passed" class="summary-passed">' + totGroupsPassed +
                pluralize(' group', totGroupsPassed) + '/' + totTestsPassed + pluralize(' test', totTestsPassed) + '/' +
                totAssertionsPassed + pluralize(' assertion', totAssertionsPassed) +
                ' passed.</div><div id="preamble-results-summary-failed" class="summary-failed">' + queue.totGroupsFailed +
                pluralize(' group', queue.totGroupsFailed) + '/' + queue.totTestsFailed + pluralize(' test', queue.totTestsFailed) +
                '/' + queue.totAssertionsFailed + pluralize(' assertion', queue.totAssertionsFailed) + ' failed.</div>';
        }
        document.getElementById('preamble-status-container').insertAdjacentHTML('beforeend', html);
    }

    //v2.0.0 Returns the "line" in the stack trace that points to the failed assertion.
    function stackTrace(st) {
        //Get all file references...
        var matches = st.match(reFileFromStackTrace);
        //... and filter out all references to preamble.js.
        return matches.reduce(function(previousValue, currentValue){
            if(currentValue.search(/preamble.js/) === -1){
                return previousValue + '<p class="stacktrace">at ' + currentValue + '</p>';
            }else{
                return previousValue;
            }
        }, '');
    }

    //v.2.0.0 Including the stack trace file reference for failed assertions.
    function showResultsDetails(results){
        var groupLabel = '',
            testLabel = '',
            html = '', 
            //v2.0.0 Hide passed tests.
            hidePassed = document.getElementById('hidePassedGroups').checked,
            //v2.0.0 Titles for anchor tags.
            groupTile = 'title="Click here to filter by this group."',
            testTitle = 'title="Click here to filter by this test."',
            assertionTitle = 'title="Click here to filter by this assertion."',
            as,
            i,
            len;
        document.getElementById('preamble-results-container').style.display = 'block';
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
                //v2.0.0 Added "data-passed" attribute for hiding passed tests.
                html += '<div class="group-container' + (hidePassed && result.groupResult ? ' hidden' : '') + 
                    '" ' + 'data-passed="' + result.groupResult + '"><a class="group' + (!result.groupResult ? ' failed' : '') + '" href="?group=' +
                    encodeURI(result.groupLabel) + '" ' + groupTile + '>' + result.groupLabel + ' (' + result.groupDuration + 'ms)' + '</a>';
                groupLabel = result.groupLabel;
            }
            if(result.testLabel !== testLabel){
                html += '<div class="tests-container' + (hidePassed && result.testResult ? ' hidden' : '') +
                    '" ' + 'data-passed="' + result.testResult + '"><a class="test' + (!result.testResult ? ' failed' : '') + '" href="?group=' +
                    encodeURI(result.groupLabel) + '&test=' + encodeURI(result.testLabel) + '" ' + testTitle + '>' + result.testLabel + 
                    ' (' + result.testDuration + 'ms)' + '</a>';
                testLabel = result.testLabel;
            }
            if(!result.result){
                html += '<div class="assertion-container' + (hidePassed && result.result ? ' hidden' : '') + 
                    '" ' + 'data-passed="' + result.result + '"><a class="assertion failed" href="?group=' + encodeURI(result.groupLabel) +
                    '&test=' + encodeURI(result.testLabel) + '&assertion=' + encodeURI(result.assertionLabel) + '" ' + assertionTitle + '>Error: "' +
                    result.assertionLabel + '" (' + result.displayAssertionName +
                    ')  failed:</a></div><div class="stacktrace-container failed bold">' + stackTrace(result.stackTrace) + '</div>';
            }else{
                html += '<div class="assertion-container' + (hidePassed && result.result ? ' hidden' : '') + 
                    '" ' + 'data-passed="' + result.result + '"><a class="assertion passed" href="?group=' + encodeURI(result.groupLabel) +
                    '&test=' + encodeURI(result.testLabel) + '&assertion=' + encodeURI(result.assertionLabel) + '" ' + assertionTitle + '>"' +
                    result.assertionLabel + '" (' + result.displayAssertionName + ')  passed"</a></div>';
            }
        });
        html += '</div></div>';
        document.getElementById('preamble-results-container').innerHTML = html;
        domAddEventHandler(document.getElementById('hidePassedGroups'), 'click', hpgClickHandler);
        //domAddEventHandler(document.getElementById('runAll'), 'click', runAllClickHandler);
        //TODO(Jeff): Should use event delegation here!
        as = document.getElementsByTagName('a');
        for(i = 0, len = as.length; i < len; i++){
            domAddEventHandler(as[i], 'click', runAllClickHandler);
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
        return a === false;
    }

    //Simple boolean test.
    function a_is_truthy(a){
        return (a);
    }

    //Simple boolean test.
    function a_is_not_truthy(a){
        return (!a);
    }

    //Assertion runners.

    //"strict" a === b
    function assertEqual(a, b){
        return a_equals_b(a, b);
    }
    assertEqual._desc = 'equal';

    //"strict" a === true, simple boolean test
    function assertIsTrue(a){
        return a_equals_true(a);
    }
    assertIsTrue._desc = 'isTrue';

    //"non strict" a == true, simple boolean test
    function assertIsTruthy(a){
        return a_is_truthy(a);
    }
    assertIsTruthy._desc = 'isTruthy';

    //"strict" a !== b
    function assertNotEqual(a, b){
        return a_notequals_b(a, b);
    }
    assertNotEqual._desc = 'notEqual';

    //"strict" a === false, simple boolean test
    function assertIsFalse(a){
        return a_equals_false(a);
    }
    assertIsFalse._desc = 'isFalse';

    //"non strict" a == true, simple boolean test
    function assertIsNotTruthy(a){
        return a_is_not_truthy(a);
    }
    assertIsNotTruthy._desc = 'isNotTruthy';

    function runAssertions(test){
        var assertionsQueue = test.assertions,
            i,
            len,
            item;
        test.totFailed = 0;
        //Iterate over the assertionsQueue, running each item's assertion.
        for (i = 0, len = assertionsQueue.length; i < len; i++) {
            item = assertionsQueue[i];
            item.result = item.assertion(typeof item.value === 'function' ? item.value() : item.value, item.expectation);
            item.displayAssertionName = item.assertion._desc;
            if(config.shortCircuit && !item.result){
                isShortCircuited = test.isShortCircuited = item.isShortCircuited = true;
                return;
            }
        }
    }

    //v2.0.0 Pushing stack trace onto the queue and maintain assertions counter.
    function pushOntoAssertions(assertion, assertionLabel, value, expectation, stackTrace){
        currentTestHash.assertions.push({
            assertion: assertion, 
            assertionLabel: assertionLabel, 
            value: value, 
            expectation: expectation, 
            stackTrace: stackTrace
        });
        queue.totAssertions++;
    }

    function throwException(errMessage){
        throw new Error(errMessage);
    }

    //v.2.0.0 Sets the stack trace property used by the browser.
    function setStackTraceProperty(){
        try{
            throw new Error('woops');
        }catch(error){
            stackTraceProperty = error.stack ? 'stack' : error.stacktrace ? 'stacktrace' : undefined;
        }
    }

    //v2.0.0 Returns the stack trace from an error object.
    function stackTraceFromError(){
        var stack = null;
        if(stackTraceProperty){
            try{
                throw new Error();
            }catch(error){
                stack = error[stackTraceProperty];
            }
        }
        return stack;
    }

    //v.2.0.0 Including a stack trace.
    function noteEqualAssertion(value, expectation, label){
        if(arguments.length !== 3){
            throwException('Assertion "equal" requires 3 arguments, found ' + arguments.length);
        }
        if(filter('assertion', {
            group: queue[currentGroupIndex].groupLabel, 
            test: queue[currentGroupIndex].tests[currentTestIndex].testLabel, 
            assertion: label
        })){
            //Deep copy value and expectation to freeze them against future changes when running an asynchronous test.
            pushOntoAssertions(assertEqual, label, currentTestHash.isAsync ? deepCopy(value) : value,
                currentTestHash.isAsync ? deepCopy(expectation) : expectation, stackTraceFromError());
        }
    }

    //v.2.0.0 Including a stack trace.
    function noteIsTrueAssertion(value, label){
        if(arguments.length !== 2){
            throwException('Assertion "equal" requires 3 arguments, found ' + arguments.length);
        }
        if(filter('assertion', {
            group: queue[currentGroupIndex].groupLabel, 
            test: queue[currentGroupIndex].tests[currentTestIndex].testLabel, 
            assertion: label
        })){
            pushOntoAssertions(assertIsTrue, label, value, true, stackTraceFromError());
        }
    }

    //v.2.0.0 Including a stack trace.
    function noteIsTruthyAssertion(value, label){
        if(arguments.length !== 2){
            throwException('Assertion "equal" requires 3 arguments, found ' + arguments.length);
        }
        if(filter('assertion', {
            group: queue[currentGroupIndex].groupLabel, 
            test: queue[currentGroupIndex].tests[currentTestIndex].testLabel, 
            assertion: label
        })){
            pushOntoAssertions(assertIsTruthy, label, value, true, stackTraceFromError());
        }
    }

    //v.2.0.0 Including a stack trace.
    function noteNotEqualAssertion(value, expectation, label){
        if(arguments.length !== 3){
            throwException('Assertion "equal" requires 3 arguments, found ' + arguments.length);
        }
        if(filter('assertion', {
            group: queue[currentGroupIndex].groupLabel, 
            test: queue[currentGroupIndex].tests[currentTestIndex].testLabel, 
            assertion: label
        })){
            //Deep copy value and expectation to freeze them against future changes when running an asynchronous test.
            pushOntoAssertions(assertNotEqual, label, currentTestHash.isAsync ? deepCopy(value) : value,
                currentTestHash.isAsync ? deepCopy(expectation) : expectation, stackTraceFromError());
        }
    }

    //v.2.0.0 Including a stack trace.
    function noteIsFalseAssertion(value, label){
        if(arguments.length !== 2){
            throwException('Assertion "equal" requires 3 arguments, found ' + arguments.length);
        }
        if(filter('assertion', {
            group: queue[currentGroupIndex].groupLabel, 
            test: queue[currentGroupIndex].tests[currentTestIndex].testLabel, 
            assertion: label
        })){
            pushOntoAssertions(assertIsFalse, label, value, true, stackTraceFromError());
        }
    }

    //v.2.0.0 Including a stack trace.
    function noteIsNotTruthyAssertion(value, label){
        if(arguments.length !== 2){
            throwException('Assertion "equal" requires 3 arguments, found ' + arguments.length);
        }
        if(filter('assertion', {
            group: queue[currentGroupIndex].groupLabel, 
            test: queue[currentGroupIndex].tests[currentTestIndex].testLabel, 
            assertion: label
        })){
            pushOntoAssertions(assertIsNotTruthy, label, value, true, stackTraceFromError());
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
        currentTestHash.beforeTestVal = queue[currentGroupIndex].beforeEachTest();
        currentTestStep++;
        runTest();
    }

    //Runs setup asynchronously for each test.
    function runBeforeEachAsync(){
        currentTestHash.beforeTestVal = queue[currentGroupIndex].asyncBeforeEachTest();
        setTimeout(function(){
            currentTestStep++;
            runTest();
        }, currentTestHash.asyncBeforeTestInterval || config.asyncBeforeAfterTestDelay);
    }

    //Runs tear down synchronously for each test.
    function runAfterEachSync(){
        queue[currentGroupIndex].afterEachTest();
        currentTestStep++;
        runTest();
    }

    //Runs tear down asynchronously for each test.
    function runAfterEachAsync(){
        queue[currentGroupIndex].asyncAfterEachTest();
        setTimeout(function(){
            currentTestStep++;
            runTest();
        }, currentTestHash.asyncAfterTestInterval || config.asyncBeforeAfterTestDelay);
    }

    //Runs the 5 steps of a test's life cycle - 1) before each test, 2) test, 3) after each test,
    //4) run assertions, 5) setup next test. The current test is the one pointed to by currentTestHash.
    function runTest(){
        switch(currentTestStep){
            case 0: //Runs beforeEach.
                currentTestHash.start = Date.now();
                if(queue[currentGroupIndex].beforeEachTest){
                    runBeforeEachSync();
                }else if(queue[currentGroupIndex].asyncBeforeEachTest){
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
                if(queue[currentGroupIndex].afterEachTest){
                    runAfterEachSync();
                }else if(queue[currentGroupIndex].asyncAfterEachTest){
                    runAfterEachAsync();
                }else{
                    currentTestStep++;
                    runTest();
                }
                break;
            case 3: //Run assertions.
                runAssertions(currentTestHash);
                currentTestHash.end = Date.now();
                currentTestStep++;
                runTest();
                break;
            case 4: //Sets up the processing of the next test to be run.
                emit('runTest');
                break;
        }
    }

    //Note runBeforeEach.
    function beforeEachTest(callback){
        var cgqi = queue[queue.length - 1];
        cgqi.beforeEachTest = callback;
    }

    //Note asyncRunBeforeEach.
    function asyncBeforeEachTest(callback){
        var cgqi = queue[queue.length - 1];
        if(arguments.length === 2){
            cgqi.asyncBeforeTestInterval = arguments[0];
            cgqi.asyncBeforeEachTest = arguments[1];
        }else{
            cgqi.asyncBeforeEachTest = callback;
        }
    }

    //Note runAfterEach.
    function afterEachTest(callback){
        var cgqi = queue[queue.length - 1];
        cgqi.afterEachTest = callback;
    }

    //Note asyncRunAfterEach.
    function asyncAfterEachTest(callback){
        var cgqi = queue[queue.length - 1];
        if(arguments.length === 2){
            cgqi.asyncAfterTestInterval = arguments[0];
            cgqi.asyncAfterEachTest = arguments[1];
        }
        cgqi.asyncAfterEachTest = callback;
    }

    //Provides closure and a label to a group of tests.
    function group(label, callback){
        var start,
            end;
        //v2.0.0 Parameter checking.
        if(arguments.length !== 2){
            throwException('group requires 2 arguments, found ' + arguments.length);
        }
        if(filter('group', {group: label})){
            queue.push({groupLabel: label, callback: callback, tests: []});
            start = Date.now();
            callback(); //will call function test/asyncTest.
            end = Date.now();
            queue[queue.length - 1].duration = end - start;
        }
    }

    //Provides closure and a label to a synchronous test
    //and registers its callback in its testsQueue item.
    function test(label, callback){
        var cgqi = queue[queue.length - 1];
        //v2.0.0 Parameter checking.
        if(arguments.length !== 2){
            throwException('test requires 2 arguments, found ' + arguments.length);
        }
        if(filter('test', {group: cgqi.groupLabel, test: label})){
            cgqi.tests.push(combine(currentTestHash,{testLabel: label, testCallback: callback, isAsync: false, assertions: []}));
            queue.totTests++;
        }
    }

    //Provides closure and a label to an asynchronous test
    //and registers its callback in its testsQueue item.
    //Form: asyncTest(label[, interval], callback).
    function asyncTest(label){
        var cgqi = queue[queue.length - 1];
        //v2.0.0 Parameter checking.
        if(arguments.length < 2){
            throwException('asynTest requires 2 or 3 arguments, found ' + arguments.length);
        }
        if(filter('test', {group: cgqi.groupLabel, test: label})){
            cgqi.tests.push(combine(currentTestHash, {
                testLabel: label, testCallback: arguments.length === 3 ? arguments[2] : arguments[1],
                isAsync: true, asyncInterval: arguments.length === 3 ? arguments[1] : config.asyncTestDelay, assertions: []}));
            queue.totTests++;

        }
    }

    //Returns the ui test container element.
    function getUiTestContainerElement(){
        return document.getElementById(config.uiTestContainerId);
    }

    //Returns the id of the ui test container element.
    function getUiTestContainerElementId(){
        return config.uiTestContainerId;
    }

    //Completely rewritten for v1.2.0.
    //A factory that creates a proxy wrapper for any function or object method property.
    //Use it to determine if the wrapped function was called, how many times it was called,
    //the arguments that were passed to it, the contexts it was called with and what it
    //returned. Extremely useful for testing synchronous and asynchronous methods.
    function proxy(){
        var proxyFactory = function(){
            //The wrapped function to call.
            var fnToCall = arguments.length === 2 ? arguments[0][arguments[1]] : arguments[0],
                //A counter used to note how many times proxy has been called.
                xCalled = 0,
                //An array whose elements note the context used to call the wrapped function.
                contexts = [],
                //An array of arrays used to note the arguments that were passed to proxy.
                argsPassed = [],
                //An array whose elements note what the wrapped function returned.
                returned = [],
                //
                //Privileged functions used by API
                //
                //Returns the number of times the wrapped function was called.
                getCalledCount = function(){
                    return xCalled;
                },
                //If n is within bounds returns the context used on the nth
                //call to the wrapped function, otherwise returns undefined.
                getContext = function(n){
                    if(n >= 0 && n < xCalled){
                        return contexts[n];
                    }
                },
                //If called with 'n' and 'n' is within bounds then returns the
                //array found at argsPassed[n], otherwise returns argsPassed.
                getArgsPassed = function(){
                    if(arguments.length === 1 && arguments[0] >= 0 && arguments[0] < argsPassed.length){
                        return argsPassed[arguments[0]];
                    }else{
                        return argsPassed;
                    }
                },
                //value found at returned[n], otherwise returns returned.
                getReturned = function(){
                    if(arguments.length === 1 && arguments[0] >= 0 && arguments[0] < returned.length){
                        return returned[arguments[0]];
                    }else{
                        return returned;
                    }
                },
                //If 'n' is within bounds then returns an
                //info object, otherwise returns undefined.
                getData= function(n){
                    var args,
                        context,
                        ret;
                    if(n >= 0 && n < xCalled){
                        args = getArgsPassed(n);
                        context = getContext(n);
                        ret = getReturned(n);
                        return {
                            count: n + 1,
                            argsPassed: args,
                            context: context,
                            returned: ret
                        };
                    }
                },
                //If you just want to know if the wrapped function was called
                //then call wasCalled with no args. If you want to know if the
                //callback was called n times, pass n as an argument.
                wasCalled = function(){
                    return arguments.length === 1 ? arguments[0] === xCalled : xCalled > 0;
                },
                //A higher order function - iterates through the collected data and
                //returns the information collected for each invocation of proxy.
                dataIterator = function(callback){
                    var i;
                    for(i = 0; i < xCalled; i++){
                        callback(getData(i));
                    }
                },
                //The function that is returned to the caller.
                fn = function(){
                    var args,
                        ret;
                    //Note the context that the proxy was called with.
                    contexts.push(this);
                    //Note the arguments that were passed for this invocation.
                    args = [].slice.call(arguments);
                    argsPassed.push(args.length ? args : []);
                    //Increment the called count for this invocation.
                    xCalled += 1;
                    //Call the wrapped function noting what it returns.
                    ret = fnToCall.apply(this, args);
                    returned.push(ret);
                    //Return what the wrapped function returned to the caller.
                    return ret;
                };
            //Exposed lovwer level API - see Privileged functions used by API above.
            fn.getCalledCount = getCalledCount;
            fn.getContext = getContext;
            fn.getArgsPassed = getArgsPassed;
            fn.getReturned = getReturned;
            fn.getData = getData;
            //Exposed Higher Order API - see Privileged functions used by API above.
            fn.wasCalled = wasCalled;
            fn.dataIterator = dataIterator;
            //Replaces object's method property with proxy's fn.
            if(arguments.length === 2){
                arguments[0][arguments[1]] = fn;
            }
            //Return fn to the caller.
            return fn;
        };
        //Convert arguments to an array, call factory and returns its value to the caller.
        return proxyFactory.apply(null, [].slice.call(arguments));
    }

    function showCoverage(){
        var show = runtimeFilter.group || config.filters.length ? 'Filtered' : 'Covered',
            elStatusContainer = document.getElementById('preamble-status-container'),
            coverage = '<div id="coverage">' + show + ' {{tg}}/{{tt}}/{{ta}}' +
            '<div class="hpgui"><label for="hidePassedGroups">Hide passed tests</label>' + 
            '<input id="hidePassedGroups" type="checkbox" {{checked}}></div>' +
            ' - <a id="runAll" href="?"> run all</a>' +
            '</div>',
            hpg;
        //Show groups and tests coverage in the header.
        coverage = coverage.replace(/{{tg}}/, queue.length + pluralize(' group', queue.length));
        coverage = coverage.replace(/{{tt}}/, queue.totTests + pluralize(' test', queue.totTests));
        coverage = coverage.replace(/{{ta}}/, queue.totAssertions + pluralize(' assertion', queue.totAssertions));
        hpg = loadPageVar('hpg');
        hpg = hpg && hpg === true;
        hpg = hpg === '' && config.hidePassedGroups;
        coverage = coverage.replace(/{{checked}}/, hpg ? 'checked' : '');
        //v2.0.0 Preserve error message that replaces 'Building queue. Please wait...'.
        if(elStatusContainer.innerHTML === '<div class="summary">Building queue. Please wait...</div>'){
            elStatusContainer.innerHTML = coverage;
        }else{
            elStatusContainer.innerHTML += coverage;
        }
        document.getElementById('coverage').style.display = 'block';
    }

    /**
     * It all starts here!!!
     */

    //v2.0.0 Start time, used to report total elapsed time.
    queue.start = Date.now();

    //Configure the runtime environment.
    configure();

    /**
     * v2.0.0 A hash-of-hashes pubsub implementation.
     */

    var pubsub = window.Preamble.__ext__.pubsub = (function(){
        //subscribers is a hash of hashes:
        //{'some topic': {'some token': callbackfunction, 'some token': callbackfunction, . etc. }, . etc }
        var subscribers = {}, totalSubscribers = 0, lastToken = 0;
        //Generates a unique token.
        function getToken(){
            return lastToken += 1;
        }
        //Returns a function bound to a context.
        function bindTo(fArg, context){
            return fArg.bind(context);
        }
        //Returns a function which wraps subscribers callback in a setTimeout callback.
        function makeAsync(topic, callback){
            return function(data){
                setTimeout(function(){
                    callback(topic, data);
                }, 1);
            };
        }
        //Adds a subscriber for a topic with a callback
        //and returns a token to allow unsubscribing.
        function on(topic, handler){
            var token = getToken(),
                boundAsyncHandler = makeAsync(topic, bindTo(handler, window.Preamble.__ext__));
            //Add topic to subscribers if it doesn't already have it.
            if(!subscribers.hasOwnProperty(topic)){
                subscribers[topic] = {};
            }
            //Add subscriber to subscribers.
            subscribers[topic][token] = boundAsyncHandler;
            //Maintain a count of total subscribers.
            totalSubscribers++;
            //Return the token to the caller so it can unsubscribe.
            return token;
        }
        //Removes a subscriber for a topic.
        function off(topic, token){
            if(subscribers.hasOwnProperty(topic)){
                if(subscribers[topic].hasOwnProperty(token)){
                    delete subscribers[topic][token];
                    totalSubscribers--;
                }
            }
        }
        //Publishes an event for a topic with optional data.
        function emit(topic, data){
            var token;
            if(subscribers.hasOwnProperty(topic)){
                for(token in subscribers[topic] ){
                    if(subscribers[topic].hasOwnProperty(token)){
                        if(data){
                            subscribers[topic][token](data);
                        } else{
                            subscribers[topic][token]();
                        }
                    }
                }
            }
        }
        //Returns the total subscribers count.
        function getCountOfSubscribers(){
            return totalSubscribers;
        }
        //Returns the subscriber count by topic.
        function getCountOfSubscribersByTopic(topic){
            var prop, count = 0;
            if(subscribers.hasOwnProperty(topic)){
                for(prop in subscribers[topic]){
                    if(subscribers[topic].hasOwnProperty(prop)){
                        count++;
                    }
                }
            }
            return count;
        }
        //Returns the object that exposes the pubsub API.
        return {
            on: on,
            off: off,
            emit: emit,
            getCountOfSubscribers: getCountOfSubscribers,
            getCountOfSubscribersByTopic: getCountOfSubscribersByTopic
        };
    }());

    /**
     * v2.0.0 Internal event handling.
     */

    //Convenience method for registering handlers.
    function on(topic, handler){
        pubsub.on(topic, handler);
    }

    //Convenience method for emiting and event.
    function emit(topic, data){
        pubsub.emit(topic, data);
    }

    //Returns the duration for a group by reducing it's 'tests' durations.
    function duration(collection) {
        return collection.reduce(function(prevValue, curValue){
            return prevValue + curValue.duration;
        }, 0);
    }

    //Flattens queue to an array of results that can be easily reported.
    function mapGroupsToResults(){
        var results = [];
        queue.forEach(function(group){
            group.tests.forEach(function(test){
                test.assertions.forEach(function(assertion){
                    results.push({
                        groupLabel: group.groupLabel,
                        groupDuration: group.duration,
                        groupResult: group.result,
                        testLabel: test.testLabel,
                        testDuration: test.duration,
                        testResult: test.result,
                        result: assertion.result,
                        assertionLabel: assertion.assertionLabel,
                        displayAssertionName: assertion.displayAssertionName,
                        stackTrace: assertion.stackTrace
                    });
                });
            });
        });
        return results;
    }

    //Initialize.
    on('start', function(){
        //Overall passed/failed.
        queue.result = true;
        //Total failed groups.
        queue.totGroupsFailed = 0;
        //Total failed tests.
        queue.totTestsFailed = 0;
        //Total failed assertions.
        queue.totAssertionsFailed = 0;
        currentGroupIndex = -1;
        emit('runGroup');
    });

    //Runs a single group.
    on('runGroup', function(){
        var group = currentGroupIndex >= 0 && queue[currentGroupIndex];
        if(group){
            group.duration += duration(group.tests);
            //Record how many tests failed.
            group.totFailed = group.tests.reduce(function(prevValue, test){
                return !test.result ? prevValue + 1 : prevValue;
            }, 0);
            group.result = group.totFailed ? false : true;
        }
        currentGroupIndex++;
        if(currentGroupIndex < queue.length && !isShortCircuited){
            currentTestIndex = -1;
            emit('runTest');
        }else{
            emit('end');
        }
    });

    //Runs a single test.
    on('runTest', function(){
        var test = currentTestIndex >= 0 && queue[currentGroupIndex].tests[currentTestIndex],
            elapsed;
        if(test){
            //Mark the test with how many of its assertions failed.
            test.totFailed = test.assertions.reduce(function(prevValue, curValue){
                return !curValue.result ? prevValue + 1 : prevValue;
            }, 0);
            //Mark the test as either passed or failed based on assertion failures.
            test.result = test.totFailed === 0;
            if(!test.result){
                //Mark tests as having failed.
                queue[currentGroupIndex].tests.result = false;
            }
            elapsed = test.end - test.start;
            //Don't report 0 durations!
            test.duration = elapsed > 0 ? elapsed : 1;
        }
        currentTestIndex++;
        if(currentTestIndex < queue[currentGroupIndex].tests.length && !isShortCircuited){
            currentTestHash = queue[currentGroupIndex].tests[currentTestIndex];
            currentTestStep = 0;
            runTest();
        }else{
            emit('runGroup');
        }
    });

    //All groups ran.
    on('end', function(){
        queue.duration = duration(queue);
        //Record how many assertions failed.
        queue.totAssertionsFailed = queue.reduce(function(prevValue, group){
            var t = group.tests.reduce(function(prevValue, test){
                return test.totFailed ? prevValue + test.totFailed : 0;
            }, 0);
            return prevValue + t;
        }, 0);
        //Record how many tests failed.
        queue.totTestsFailed = queue.reduce(function(prevValue, group){
            var t = group.tests.reduce(function(prevValue, test){
                return !test.result ? prevValue + 1 : prevValue;
            }, 0);
            return prevValue + t;
        }, 0);
        //Record how many groups failed.
        queue.totGroupsFailed = queue.reduce(function(prevValue, group){
            return !group.result ? prevValue + 1 : prevValue;
        }, 0);
        queue.result = queue.totAssertionsFailed === 0;
        queue.end = Date.now();
        queue.totalElapsedTime = queue.end - queue.start;
        showResultsSummary();
        showResultsDetails(mapGroupsToResults());
    });

    /**
     * v2.0.0 For external reporting.
     * Subscribe to pubsub to show status updates in the console.
     * TODO(J.S.) Comment this out prior to release?
     */

    on('status update', function(topic, data){
        //TODO(jeff): remove console.log before merging with development.
        console.log('topic:', doubleQuote(topic), 'status:', doubleQuote(data.status), 'data:', data[data.status]);
    });

    /**
     * v2.0.0 For external reporting.
     * Higher-level functionality ontop of pubsub.
     */

    function publishStatusUpdate(data) {
        emit('status update', data);
    }

    /**
     * Wait while the queue is loaded.
     */

    //Catch errors.
    try{
        //v2.0.0 For external reporting. Set status to "loading".
        publishStatusUpdate({status: 'loading'});
        //Wait while the queue is built as scripts call group function.
        //Keep checking the queue's length until it is 'stable'.
        //Keep checking that config.autoStart is true.
        //Stable is defined by a time interval during which the length
        //of the queue remains constant, indicating that all groups
        //have been loaded. Once stable, run the tests.
        //config.autoStart can only be false if it set by an external
        //process (e.g. Karma adapter).
        intervalId = setInterval(function(){
            if(queue.length === prevQueueCount){
                if(queueStableCount > 1 && config.autoStart){
                    clearInterval(intervalId);
                    //Run!
                    emit('start');
                }else{
                    queueStableCount++;
                }
            }else{
                queueStableCount = 0;
                prevQueueCount = queue.length;
            }
        }, queueStableInterval);
    } catch(e) {
        errorHandler(e);
    }
}(window));
