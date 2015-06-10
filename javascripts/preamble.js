//Preamble v3.0.0-rc1 (Pern)
//(c) 2013 - 2015 Jeffrey Schwartz
//Preamble may be freely distributed under the MIT license.
(function(window, undefined){
    'use strict';

    //Version
    var version = 'v3.0.0-rc1 (Pern)',
        //Merged configuration options.
        config = {},
        queue=[],
        prevQueueCount = 0,
        queueStableCount = 0,
        queueStableInterval = 1,
        reFileFromStackTrace = /file:\/\/\/\S+\.js:[0-9]+[:0-9]*/g,
        reporter,
        spy,
        iteratorFactory,
        assert,
        intervalId,
        runtimeFilter,
        stackTraceProperty,
        queueBuilder,
        pubsub,
        tests,
        testsIterator;

    /**
     * Polyfil for bind - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
     * Required when using phantomjs - its javascript vm doesn't currently support Function.prototype.bind.
     * TODO(Jeff): remove polyfil once phantomjs supports bind!
     */
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== 'function') {
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
            }
            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                FNOP = function () {},
                fBound = function () {
                    return fToBind.apply(this instanceof FNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
                };
            FNOP.prototype = this.prototype;
            fBound.prototype = new FNOP();
            return fBound;
        };
    }

    function argsToArray(argArguments){
        return [].slice.call(argArguments, 0);
    }

    function throwException(errMessage){
        throw new Error(errMessage);
    }

    /**
     * A group.
     * @constructor
     * @param {[Group]} parentGroups
     * @param {string} path
     * @param {string} label
     * @param {function} callback
     */
    function Group(parentGroups, id, path, label, callback){
        this.parentGroups = parentGroups.slice(0); //IMPORTANT: make a "copy" of the array
        this.id = id;
        this.path = path;
        this.label = label;
        this.callback = callback;
        this.duration = 0;
        this.passed = true;
    }

    /**
     * Returns the concatenated labels from all parent groups.
     * @param {array} parents An array of parent groups.
     */
    Group.prototype.pathFromParentGroupLabels = function pathFromParentGroupLabels(){
        /* jshint validthis: true */
        var path;
        if(!this.parentGroups.length){
            return this.label;
        }else{
            path = this.parentGroups.reduce(function(prev, current){
                return prev === '' && current.label || prev + ' ' + current.label;
            }, '');
            return path + ' ' + this.label;
        }
    };

    /**
     * A test.
     * @constructor
     * @param {[Group] parentGroups
     * @param {string} path
     * @param {string} label
     * @param {integer} timeoutInterval
     * @param {function} callback
     */
    function Test(parentGroups, id, path, label, stackTrace, timeoutInterval, callback){
        this.parentGroups = parentGroups.slice(0); //IMPORTANT: make a "copy" of the array
        this.parentGroup = parentGroups[parentGroups.length - 1];
        this.id = id;
        this.path = path;
        this.label = label;
        this.stackTrace = stackTrace;
        this.timeoutInterval = timeoutInterval;
        this.callback = callback;
        this.assertions = []; //contains assertions
        this.duration = 0;
        this.befores = []; //the befores to call prior to running this test
        this.afters = []; //the afters to call prior to running this test
        this.context = {}; //the context used to call befores and afters

        //gather befores and afters for easy traversal
        this.parentGroups.forEach(function(g){
            if(g.beforeEachTest){
                //bind each before callback to this.context
                this.befores.push(g.beforeEachTest.bind(this.context));
            }
            if(g.afterEachTest){
                //bind each after callback to this.context
                this.afters.push(g.afterEachTest.bind(this.context));
            }
        }, this);
    }

    /**
     * Sets all parent groups' passed property to false.
     */
    Test.prototype.markParentGroupsFailed = function(){
        this.parentGroups.forEach(function(pg){
            pg.passed = false;
        });
    };

    /**
     * Test runner.
     * @param {function} callback e.g. fn(err, value)
     */
    Test.prototype.run = function(callback){
        var beforesIterator = iteratorFactory(this.befores),
            aftersIterator = iteratorFactory(this.afters),
            self = this;

        //run a before
        function runBefore(callback){
            var before = beforesIterator.getNext();
            if(before.length){
                //call it asynchronously.
                before(function(){
                    callback();
                });
            }else{
                setTimeout(function(){
                    before();
                    callback();
                }, 0);
            }
        }

        //run befores
        function runBefores(callback){
            if(beforesIterator.hasNext()){
                runBefore(function(){
                    runBefores(callback);
                });
            }else{
                callback();
            }
        }

        //run the test
        function runTest(callback){
            if(config.windowGlobals){
                if(self.callback.length){
                    //Pass done callback as 1st param if configured to use window globals.
                    self.callback.call(self.context, function(){
                        if(arguments.length && typeof(arguments[0] === 'function')){
                            arguments[0].call(self.context);
                        }
                        self.runAssertions();
                        callback();
                    });
                }else{
                    self.callback.call(self.context);
                    self.runAssertions();
                    callback();
                }
            }else{
                if(self.callback.length === 1){
                    //Pass done callback as 1st param if configured to use window globals.
                    self.callback.call(self.context, function(){
                        if(arguments.length && typeof(arguments[0] === 'function')){
                            arguments[0].call(self.context);
                        }
                        self.runAssertions();
                        callback();
                    });
                }else{
                    self.callback.call(self.context);
                    self.runAssertions();
                    callback();
                }
            }
        }

        //run an after
        function runAfter(callback){
            var after = aftersIterator.getNext();
            if(after.length){
                //call it asynchronously.
                after(function(){
                    callback();
                });
            }else{
                setTimeout(function(){
                    after();
                    callback();
                }, 0);
            }
        }

        //run the afters
        function runAfters(callback){
            if(aftersIterator.hasNext()){
                runAfter(function(){
                    runAfters(callback);
                });
            }else{
                callback();
            }
        }

        (function(test){
            //Set a timer for the test and fail it if it isn't completed in time.
            //Note to self: Since this can fire after the test it is timing has
            //completed it is possible that "self" no longer refers to the original
            //test. To insure that when this fires it always refers to the test
            //it was timing, the test is captured via closure uaing the module
            //pattern and passing "self" as an argument.
            setTimeout(function(){
                if(!test.completed){
                    //mark test failed
                    test.timedOut = true;
                    //test.totFailed = -1;
                    //test.parentGroup.passed = false;
                    //callback();
                }
            }, test.timeoutInterval);

            //Run the before callbacks, test callback and after callbacks.
            //Note to self: Since this can fire after the test has already timed
            //out and failed, it is possible that "self" no longer refers to the
            //original test. To insure that when this fires it always refers to
            //the test it was running, the test is captured via closure uaing the
            //module pattern and passing "self" as an argument.
            setTimeout(function(){
                var start = Date.now();
                var d;
                runBefores(function(){
                    runTest(function(){
                        runAfters(function(){
                            if(test.timedOut){
                                test.totFailed = -1;
                                test.markParentGroupsFailed();
                            }else{
                                test.completed = true;
                                d = Date.now() - start;
                                test.duration = d > 0 && d || 1;
                                if(test.totFailed){
                                    test.markParentGroupsFailed();
                                }
                            }
                            callback();
                        });
                    });
                });
            }, 0);
        }(self));
    };

    /**
     * Runs assertions.
     */
    Test.prototype.runAssertions = function(){
        var i,
            len,
            item,
            result;
        this.totFailed = 0;
        for (i = 0, len = this.assertions.length; i < len; i++) {
            item = this.assertions[i];
            result = item.assertion(item.value, item.expectation);
            item.result = result.result;
            this.totFailed = item.result ? this.totFailed : this.totFailed += 1;
            item.explain = result.explain;
        }
        emit('runAfters');
    };

    /**
     * Returns an array of paths.
     */
    Test.prototype.getPaths = function(){
        var paths,
            ancestors;
        paths = this.path.split('/');
        ancestors = paths.filter(function(v, i, a){
            return i !== 0 && i !== a.length - 1;
        });
        return ancestors;
    };

    /**
     * HtmlReporter.
     * @constructor
     */
    function HtmlReporter(fnShowHidePassedTests){
        this.preambleTestContainer = document.getElementById('preamble-test-container');
        this.preambleUiContainer = document.getElementById('preamble-ui-container');
        this.showHidePassedTests = fnShowHidePassedTests;
        this.init();
        on('configchanged', function(topic, args){
            //Add structure to the document and show the header.
            this.updateHeader(args.name, 'Preamble ' + version, args.uiTestContainerId);
        }, this);
    }

    /**
     * Add structure to the DOM/show the header.
     */
    HtmlReporter.prototype.init = function(){
        var s = '<header>' +
                    '<div class="banner-table">' +
                        '<section id="banner">' +
                            '<h1>' +
                                '<span id="name">Test</span> - ' +
                                '<span>' +
                                    '<span> ' +
                                        '<span>' +
                                            '<i id="version">{{version}}</i>' +
                                        '</span>' +
                                    '</span>' +
                                '</span>' +
                            '</h1>' +
                        '</section>' +
                        '<section id="time">' +
                            '<span>Completed in ' +
                                '<span title="total time to completion">' +
                                    '{{tt}}ms' +
                                '</span>' +
                            '</span>' +
                        '</section>' +
                    '</div>' +
                    '<div class="table">' +
                        '<section id="preamble-status-container">' +
                            '<div class="summary">Building queue. Please wait...</div>' +
                        '</section>' +
                    '</div>' +
                '</header>' +
                '<div class="container">' +
                    '<section id="preamble-results-container"></section>' +
                '</div>';

        s = s.replace(/{{version}}/, version);
        this.preambleTestContainer.innerHTML = s;
    };

    /**
     * Updates the header.
     * @param {string} name
     * @param {string} version
     * @param {string} uiTestContainerId
     */
    HtmlReporter.prototype.updateHeader = function(name, version, uiTestContainerId){
        document.getElementById('name').innerHTML = name;
        document.getElementById('version').innerHTML = version;
        this.preambleUiContainer.innerHTML = '<div id="{{id}}" class="ui-test-container"></div>'.
            replace(/{{id}}/, uiTestContainerId);
    };

    /**
     * Shows coverage or filtered information.
     * @param {array} tests An array of Tests.
     */
    HtmlReporter.prototype.coverage = function(tests){
        var show = 'Ran {{tt}}',
            elStatusContainer = document.getElementById('preamble-status-container'),
            coverage,
            hpt;
        //Show groups and tests coverage in the header.
        show = show.replace(/{{tt}}/, tests.length - tests.totBypassed);
        if(config.testingShortCircuited){
            show += (tests.length - tests.totBypassed) && ' of {{tbpt}}';
            show = show.replace(/{{tbpt}}/, tests.length);
        } else if(runtimeFilter.group){
            show += runtimeFilter.group && ' of {{tbpt}}';
            show = show.replace(/{{tbpt}}/, tests.length);
        }
        show += pluralize(' spec', tests.length);
        coverage = '<div id="coverage">' + show +
            '<div class="hptui"><label for="hidePassedTests">Hide passed</label>' +
            '<input id="hidePassedTests" type="checkbox" {{checked}}></div>' +
            ' - <a id="runAll" href="?"> run all</a>' +
            '</div>';
        hpt = loadPageVar('hpt');
        hpt = hpt === '' && config.hidePassedTests || hpt === 'true' && true || hpt === 'false' && false;
        coverage = coverage.replace(/{{checked}}/, hpt && 'checked' || '');
        //Preserve error message that replaces 'Building queue. Please wait...'.
        if(elStatusContainer.innerHTML === '<div class="summary">Building queue. Please wait...</div>'){
            elStatusContainer.innerHTML = coverage;
        }else{
            elStatusContainer.innerHTML += coverage;
        }
        document.getElementById('coverage').style.display = 'block';
    };

    /**
     * Show summary information.
     * @param {array} tests An array containing only Tests.
     */
    HtmlReporter.prototype.summary = function(tests){
        var html,
            el,
            s;
        el = document.getElementById('time');
        s = el.innerHTML;
        s = s.replace(/{{tt}}/, tests.duration);
        el.innerHTML = s;
        el.style.display = 'table-cell';
        if(tests.result){
            html = '<div id="preamble-results-summary-passed" class="summary-passed">' +
                'All specs passed' + '</div>';
        }else{
            html = '<div id="preamble-results-summary-failed" class="summary-failed">' +
                tests.totTestsFailed + pluralize(' spec', tests.totTestsFailed) + ' failed.</div>';
        }
        document.getElementById('preamble-status-container').insertAdjacentHTML('beforeend', html);
    };

    /**
     * Show details.
     * @param {array} tests An array of Tests.
     */
    HtmlReporter.prototype.details = function(queue){
        var rc = document.getElementById('preamble-results-container'),
            groupContainerMarkup = '<ul class="group-container" data-passed="{{passed}}" id="{{id}}"></ul>',
            groupAnchorMarkup = '<li><a class="group{{passed}}" href="?group={{grouphref}}" title="Click here to filter by this group.">{{label}}</a></li>',
            testContainerMarkup = '<ul class="tests-container" data-passed="{{passed}}"></ul>',
            testAnchorMarkup = '<li><a class="{{passed}}" href="?group={{grouphref}}&test={{testhref}}" title="Click here to filter by this test.">{{label}}</a></li>',
            testFailureMarkup = '<ul class="stacktrace-container failed bold"><li class="failed bold">Error: "{{explain}}" and failed at</li><li class="failed bold">{{stacktrace}}</li></ul>',
            html = '',
            failed = '',
            parentGroup,
            el;
        queue.forEach(function(item){
            if(item instanceof(Group)){
                //Add groups to the DOM.
                html = '' + groupContainerMarkup.
                    replace(/{{passed}}/, item.passed).
                    replace(/{{id}}/, item.path);
                html = html.slice(0, -5) + groupAnchorMarkup.
                    replace(/{{passed}}/, item.bypass ? ' bypassed' : item.passed ? '' : ' failed').
                    replace('{{grouphref}}', encodeURI(item.pathFromParentGroupLabels())).
                    replace(/{{label}}/, item.label) + html.slice(-5);
                html = html;
                if(!item.parentGroups.length){
                    rc.insertAdjacentHTML('beforeend', html);
                }else{
                    parentGroup = item.parentGroups[item.parentGroups.length - 1];
                    el = document.getElementById(parentGroup.path);
                    el.insertAdjacentHTML('beforeend', html);
                }
            }else{
                //Add tests to the DOM.
                html = '' + testContainerMarkup.
                    replace(/{{passed}}/, item.totFailed ? 'false' : 'true');
                html = html.slice(0, -5) + testAnchorMarkup.
                    replace(/{{passed}}/, item.bypass ? 'test-bypassed' : item.totFailed ? 'failed' : 'passed').
                    replace('{{grouphref}}', encodeURI(item.parentGroup.pathFromParentGroupLabels())).
                    replace('{{testhref}}', encodeURI(item.label)).
                    replace(/{{label}}/, item.label) + html.slice(-5);
                //Show failed assertions and their stacks.
                if(item.totFailed > 0){
                    item.assertions.forEach(function(assertion){
                        if(!assertion.result){
                            failed = testFailureMarkup.
                                replace(/{{explain}}/, assertion.explain).
                                replace(/{{stacktrace}}/, stackTrace(assertion.stackTrace));
                            html = html.slice(0, -5) + failed + html.slice(-5);
                        }
                    });
                }else if(item.totFailed === -1){
                    failed = testFailureMarkup.
                        replace(/{{explain}}/, 'spec timed out').
                        replace(/{{stacktrace}}/, stackTrace(item.stackTrace));
                    html = html.slice(0, -5) + failed + html.slice(-5);
                }
                el = document.getElementById(item.parentGroup.path);
                el.insertAdjacentHTML('beforeend', html);
            }
        });
        this.showHidePassedTests();
        document.getElementById('preamble-results-container').style.display = 'block';
        domAddEventHandler(document.getElementById('hidePassedTests'), 'click', hptClickHandler);
        //Delegate all click events to the test container element.
        domAddEventHandler(document.getElementById('preamble-test-container'), 'click', runClickHandler);
    };

    /**
     * Events - publish/subscribe.
     */
    pubsub = (function(){
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
        function on(topic, handler, context){
            var token = getToken(),
                boundAsyncHandler;
                boundAsyncHandler = context && makeAsync(topic,
                    bindTo(handler, context)) || makeAsync(topic, handler);
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
                        if(arguments.length > 1){
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

    //Convenience method for registering handlers.
    function on(topic, handler, context){
        pubsub.on(topic, handler, context);
    }

    //Convenience method for emiting and event.
    function emit(topic, data){
        if(data){
            pubsub.emit(topic, data);
        }else{
            pubsub.emit(topic);
        }
    }

    /**
     * Internal event handling.
     */

    //Initialize.
    on('start', function(){
        tests = queue.filter(function(item){
            return item instanceof Test;
        });
        tests.result = true;
        tests.totTestsFailed = 0;
        if(tests.length){
            emit('runTests', function(){
                emit('end');
            });
        }else{
            //TODO(Jeff): perhaps this should display a message that there are no tests to run.
            emit('end');
        }
    });

    on('runTests', function(topic, callback){
        testsIterator = iteratorFactory(tests);

        function runTest(test, callback){
            if(test.bypass){
                callback();
            }else{
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
            if(testsIterator.hasNext()){
                runTest(testsIterator.getNext(), function(totFailed){
                    if(totFailed && config.shortCircuit){
                        //If totFailed and shortCircuit then abort
                        //further testing!
                        emit('testingShortCircuited');
                        callback();
                    }else{
                        runTests(callback);
                    }
                });
            }else{
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
        queueIterator = iteratorFactory(queue);
        while(queueIterator.hasNext()){
            queueObj = queueIterator.getNext();
            //Groups that haven't run will have their passed property set to true.
            if(queueObj instanceof Group && queueObj.passed){
                queueObj.bypass = true;
            //Tests that havent run do not have a totFailed property.
            }else if(queueObj instanceof Test && !queueObj.hasOwnProperty('totFailed')){
                    queueObj.bypass = true;
            }
        }
        //Set flag in config to indicate that testing has
        //been aborted due to short circuit condition.
        config.testingShortCircuited = true;
    });

    on('end', function(){
        //Record how many tests were bypassed.
        tests.totBypassed = 0;
        if(runtimeFilter.group || config.testingShortCircuited){
            tests.totBypassed = tests.reduce(function(prevValue, t){
                return t.bypass ? prevValue + 1 : prevValue;
            }, 0);
        }
        //Record how many tests failed.
        tests.totTestsFailed = tests.reduce(function(prevValue, t){
            return t.timedOut || t.totFailed ? prevValue + 1 : prevValue;
        }, 0);
        tests.result = tests.totTestsFailed === 0;
        queue.end = Date.now();
        tests.duration = queue.end - queue.start;
        reporter.coverage(tests);
        reporter.summary(tests);
        reporter.details(queue);
    });

    iteratorFactory = (function() {
        /**
         * An iterator for iterating over arrays.
         * @param {array} argArray The array to be iterated over.
         */
        function _iteratorFactory(argArray){
            var currentIndex = -1;
            if(!Array.isArray(argArray)){
                throw new Error('iteratorFactory expects an array.');
            }
            function hasNext(){
                if(argArray.length && currentIndex + 1 < argArray.length){
                    return true;
                }else{
                    return false;
                }
            }
            function next(){
                if(hasNext()){
                    currentIndex++;
                    return true;
                }else{
                    return false;
                }
            }
            function get(){
                return argArray.length && currentIndex >= 0 && currentIndex <
                    argArray.length && argArray[currentIndex];
            }
            function getNext(){
                if(next()){
                    return get();
                }
            }
            function peekForward(){
                if(currentIndex + 1 < argArray.length){
                    return argArray[currentIndex + 1];
                }
            }
            function peekBackward() {
                return argArray[currentIndex - 1];
            }
            var iterator = {
                hasNext: hasNext,
                next: next,
                get: get,
                getNext: getNext,
                peekForward: peekForward,
                peekBackward: peekBackward
            };
            return iterator;
        }
        return _iteratorFactory;
    }());

    /**
     * Process for building the queue.
     * @param {array} - queue, filled with Groups and Tests.
     * @param {function} - trhowException, a function called to throw an exception.
     */
    queueBuilder = (function(queue, throwException){

        var runner = {},
            groupStack = [],
            uniqueId = (function(){
                var i = 0;
                return function(){
                    return i += 1;
                };
            }());

        groupStack.getPath = function(){
            var result = this.reduce(function(prevValue, group){
                return prevValue + '/' + group.id;
            }, '');
            return result;
        };

        /**
         * Returns true if there is no run time filter
         * or if obj matches the run time filter.
         * Returns false otherwise.
         * @param {object} obj, either a Test or a Group.
         */
        function filter(obj){
            var path = '',
                 s;
            if(!runtimeFilter.group){
                return true;
            }else{
                if(obj instanceof(Group)){
                    path = obj.pathFromParentGroupLabels();
                    s = path.substr(0, runtimeFilter.group.length);
                    return s === runtimeFilter.group;
                }else{
                    path = obj.parentGroup.pathFromParentGroupLabels();
                    s = path.substr(0, runtimeFilter.group.length);
                    return s === runtimeFilter.group && runtimeFilter.test === '' ||
                        s === runtimeFilter.group && runtimeFilter.test === obj.label;
                }
            }
        }

        /**
         * Registers a group.
         * @param {string} label, describes the group/suite.
         * @param {function} callback,  called to run befores, test and afters.
         */
        runner.group = function(label, callback){
            var grp,
                id,
                path;
            if(arguments.length !== 2){
                throwException('requires 2 arguments, found ' + arguments.length);
            }
            id = uniqueId();
            path = groupStack.getPath() + '/' + id;
            grp = new Group(groupStack, id, path, label, callback);
            grp.bypass = !filter(grp);
            queue.push(grp);
            groupStack.push(grp);
            grp.callback();
            groupStack.pop();
        };

        /**
         * Registers a before each test process.
         * @param {function} callback,  called before running a test.
         */
        runner.beforeEachTest = function(callback){
            var parentGroup = groupStack[groupStack.length - 1];
            parentGroup.beforeEachTest = callback;
        };

        runner.afterEachTest = function(callback){
            var parentGroup = groupStack[groupStack.length - 1];
            parentGroup.afterEachTest = callback;
        };

        /**
         * Registers a test.
         * @param {string} label, describes the test/spec.
         * @param {integer} timeLimit, optional, the amount of time
         * the test is allowed to run before timing out the test.
         * @param {function} callback, called to run the test.
         */
        runner.test = function(label, timeLimit, callback){
            var tst,
                parentGroup,
                id,
                path,
                tl,
                cb,
                stackTrace;
            if(arguments.length < 2){
                throwException('requires 2 or 3 arguments, found ' + arguments.length);
            }
            tl = arguments.length === 3 && timeLimit || config.timeoutInterval;
            cb = arguments.length === 3 && callback || arguments[1];
            parentGroup = groupStack[groupStack.length - 1];
            id = uniqueId();
            path = groupStack.getPath() + '/' + id;
            stackTrace = stackTraceFromError();
            tst = new Test(groupStack, id, path, label, stackTrace, tl, cb);
            tst.bypass = !filter(tst);
            queue.push(tst);
        };

        //Return the module, exposing the runner.
        return runner;
    }(queue, throwException));

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
        }else{
            //catch(e)
            html = '<p class="failed">An error occurred,  "' + arguments[0] +
                '" and all further processing has been terminated. Please check your browser console for additional details.</p>';
        }
        document.getElementById('preamble-status-container').innerHTML = html;
    }

    /**
     * Makes words plural if their counts are 0 or greater than 1.
     * @param {string} word A word to be pluralized.
     * @param {integer} count An integer used to decide if word is to be pluralized.
     */
    function pluralize(word, count){
        var pluralizer = arguments === 2 ? arguments[1] : 's';
        return count === 0 ? word + pluralizer : count > 1 ? word + pluralizer : word;
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

    /**
     * Adds an event handle to a DOM element for an event in a cross-browser compliant manner.
     */
    function domAddEventHandler(el, event, handler){
        if( el.addEventListener){
            el.addEventListener(event, handler, false);
        }else{
            el.attachEvent('on' + event, handler);
        }
    }

    /**
     * Hide/show passed tests.
     */
    function showHidePassedTests(){
        var elUls = document.getElementsByTagName('ul'),
            i,
            ii,
            l,
            ll,
            attributes,
            elContainers = [],
            classes = '';
        for(i = 0, l= elUls.length; i < l; i++){
            attributes = elUls[i].getAttribute('class');
            if(attributes && attributes.length){
                attributes = attributes.split(' ');
                for(ii = 0, ll = attributes.length; ii < ll; ii++){
                    if(attributes[ii] === 'group-container' || attributes[ii] === 'tests-container'){
                        elContainers.push(elUls[i]);
                    }
                }
            }
        }
        if(document.getElementById('hidePassedTests').checked){
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

    /**
     * Click handler for the hide passed tests checkbox.
     * Stops propagation of the event and calls showhidePassedTests
     * to do the heavy lifting.
     */
    function hptClickHandler(evt){
        evt.stopPropagation();
        showHidePassedTests();
    }

    /**
     * Handles all anchor tag click events which are delegated to the
     * test container element.
     * When an anchor tag is clicked, persist the hidePassedTests checkbox
     * state as a query parameter and set the window location accordingly.
     * @param {object} evt A DOM event object.
     */
    function runClickHandler(evt){
        var checked,
            lastChar,
            href;
        //Only respond to delegated anchor tag click events.
        if(evt.target.tagName === 'A'){
            evt.stopPropagation();
            checked = document.getElementById('hidePassedTests').checked;
            if(config.hidePassedTests !== checked){
                evt.preventDefault();
                href = evt.target.getAttribute('href');
                lastChar = href[href.length -1];
                lastChar = lastChar === '?' ? '' : '&';
                window.location = href + lastChar + 'hpt=' + checked;
            }
        }
    }

    //Configuration is called once internally but may be called again if test script
    //employs in-line configuration.
    function configure(){
        /**
         * Default configuration options - override these in your config file
         * (e.g. var preambleConfig = {timeoutInterval: 10}) or in-line in your tests.
         *
         * windowGlobals: (default true) - set to false to not use window globals
         * (i.e. non browser environment). *IMPORTANT - USING IN-LINE CONFIGURATION
         * TO OVERRIDE THE "windowGlobals" OPTION IS NOT SUPPORTED*.
         *
         * timeoutInterval: (default 10 milliseconds) - set to some other number
         * of milliseconds to wait before a test is timed out. This number is applied
         * to all tests and can be selectively overridden by individual tests.
         *
         * name: (default 'Suite') - set to a meaningful name.
         *
         * uiTestContainerId (default id="ui-test-container") - set its id to something
         * else if desired.
         *
         * hidePassedTests: (default: false) - set to true to hide passed tests.
         *
         * shortCircuit: (default: false) - set to true to short circuit when a test fails.
         *
         * testingShortCircuited: (default: false) - *IMPORTANT - FOR INTERNAL USE ONLY*
         * When a test fails and shortCircuit is set to true then Preamble will set this
         * to true.
         *
         * autoStart: (default: true) - *IMPORTANT - FOR INTERNAL USE ONLY* Adapters
         * for external processes, such as for Karma, initially set this to false to
         * delay the execution of the tests and will eventually set it to true when
         * appropriate.
         */
        var defaultConfig = {
                windowGlobals: true,
                timeoutInterval: 10,
                name: 'Suite',
                uiTestContainerId: 'ui-test-container',
                hidePassedTests: false,
                shortCircuit: false,
                testingShortCircuited: false,
                autoStart: true
            },
            configArg = arguments && arguments[0];
        //Ignore configuration once testing has started.
        if(configArg && queue.length){
            return;
        }
        config = window.preambleConfig ? merge(defaultConfig, window.preambleConfig) : defaultConfig;
        config = configArg ? merge(config, configArg) : config;
        //Capture run-time filters, if any.
        runtimeFilter = {group: loadPageVar('group'), test: loadPageVar('test')};
        //Capture exception's stack trace property.
        setStackTraceProperty();
        //Handle global errors.
        window.onerror = errorHandler;
        //If the windowGlabals config option is false then window globals will
        //not be used and the one Preamble name space will be used instead.
        if(config.windowGlobals){
            window.configure = configure;
            window.describe = queueBuilder.group;
            window.beforeEach = queueBuilder.beforeEachTest;
            window.afterEach = queueBuilder.afterEachTest;
            window.it = queueBuilder.test;
            window.expect = noteExpectation;
            window.getUiTestContainerElement = getUiTestContainerElement;
            window.getUiTestContainerElementId = getUiTestContainerElementId;
            window.spyOn = spy;
        }else{
            window.Preamble = {
                configure: configure,
                describe: queueBuilder.group,
                beforeEach: queueBuilder.beforeEachTest,
                afterEach: queueBuilder.afterEachTest,
                it: queueBuilder.test,
                expect: noteExpectation,
                getUiTestContainerElement: getUiTestContainerElement,
                getUiTestContainerElementId: getUiTestContainerElementId,
                spyOn: spy,
            };
        }
        assert = new Assert();
        window.Preamble = window.Preamble || {};
        //For use by external processes.
        window.Preamble.__ext__ = {};
        //Expose config options to external processes.
        window.Preamble.__ext__.config = config;
        //publish config event.
        emit('configchanged', {name: config.name, uiTestContainerId: config.uiTestContainerId});
    }

    //Returns the "line" in the stack trace that points to the failed assertion.
    function stackTrace(st) {
        //Get all file references...
        var matches = st.match(reFileFromStackTrace);
        //... and filter out all references to preamble.js.
        return matches.reduce(function(previousValue, currentValue){
            if(currentValue.search(/preamble.js/) === -1){
                return previousValue + '<p class="stacktrace">' + currentValue + '</p>';
            }else{
                return previousValue;
            }
        }, '');
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

    function assertMockHasExpectations(a){
        var result = a_equals_true(a);
        return {result: result, explain: 'expected mock to have expectations'};
    }

    function assertToHaveBeenCalled(a){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to have been called'};
    }

    function assertToNotHaveBeenCalled(a){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to not have been called'};
    }

    function argToPrintableValue(a){
        var s = '';
        a.forEach(function(el){
            s = s.length ? s + ',' : s;
            switch (typeof(el)) {
                case 'string':
                    s += '\'' + el + '\'';
                    break;
                case 'function':
                    s += 'function';
                    break;
                case 'object':
                    s += JSON.stringify(el);
                    break;
                default:
                    s += el;
           }
       });
       return s;
    }

    function assertToHaveBeenCalledWith(a, b){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to have been called with ' + /*JSON.stringify(b)*/ argToPrintableValue(b)};
    }

    function assertToNotHaveBeenCalledWith(a, b){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to not have been called with ' + /*JSON.stringify(b)*/ argToPrintableValue(b)};
    }

    function assertToHaveBeenCalledWithContext(a, b){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to have been called with context ' + JSON.stringify(b)};
    }

    function assertToNotHaveBeenCalledWithContext(a, b){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to not have been called with context ' + JSON.stringify(b)};
    }

    function assertToHaveReturned(a, b){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to have returned ' + argToPrintableValue([b])};
    }

    function assertToNotHaveReturned(a, b){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to not have returned ' + argToPrintableValue([b])};
    }

    function assertToHaveThrown(a){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to have thrown an exception'};
    }

    function assertToNotHaveThrown(a){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to not have thrown an exception'};
    }

    function assertToHaveThrownWithName(a, b){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to have thrown an exception with the name ' + JSON.stringify(b)};
    }

    function assertToNotHaveThrownWithName(a, b){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to not have thrown an exception with the name ' + JSON.stringify(b)};
    }

    function assertToHaveThrownWithMessage(a, b){
        var result = a_equals_true(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to have thrown an exception with the message ' + JSON.stringify(b)};
    }

    function assertToNotHaveThrownWithMessage(a, b){
        var result = a_equals_false(a);
        // var result = a.wasCalled();
        return {result: result, explain: 'expected spy to not have thrown an exception with the message ' + JSON.stringify(b)};
    }

    function assertEqual(a, b){
        //return a_equals_b(a, b);
        var result = a_equals_b(a, b);
        return {result: result, explain: 'expected ' + argToPrintableValue([a]) + ' to equal ' + argToPrintableValue([b])};
    }

    function assertNotEqual(a, b){
        //return a_notequals_b(a, b);
        var result = a_notequals_b(a, b);
        return {result: result, explain: 'expected ' + argToPrintableValue([a]) + ' to not equal ' + argToPrintableValue([b])};
    }

    function assertIsTrue(a){
        //return a_equals_true(a);
        var result = a_equals_true(a);
        return {result: result, explain: 'expected ' + JSON.stringify(a) + ' to be true'};
    }

    function assertIsFalse(a){
        //return a_equals_false(a);
        var result = a_equals_false(a);
        return {result: result, explain: 'expected ' + JSON.stringify(a) + ' to be false'};
    }

    function assertIsTruthy(a){
        //return a_is_truthy(a);
        var result = a_is_truthy(a);
        return {result: result, explain: 'expected ' + JSON.stringify(a) + ' to be truthy'};
    }

    function assertIsNotTruthy(a){
        //return a_is_not_truthy(a);
        var result = a_is_not_truthy(a);
        return {result: result, explain: 'expected ' + JSON.stringify(a) + ' to not be truthy'};
    }

    function pushOntoAssertions(assertion, assertionLabel, value, expectation, stackTrace){
        testsIterator.get().assertions.push({
            assertion: assertion,
            assertionLabel: assertionLabel,
            value: value,
            expectation: expectation,
            stackTrace: stackTrace
        });
    }

    function completeTheAssertion(assertion,  value, stackTrace, actual){
        var ti = testsIterator,
        a = ti.get().assertions[ti.get().assertions.length - 1];
        a.assertion = assertion;
        a.expectation = value;
        a.stackTrace = stackTrace;
        a.value = typeof(actual) === 'undefined' ? a.value : actual;
    }

    function setStackTraceProperty(){
        try{
            throw new Error('woops');
        }catch(error){
            stackTraceProperty = error.stack ? 'stack' : error.stacktrace ? 'stacktrace' : undefined;
        }
    }

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

    function noteExpectation(actual){
        if(arguments.length !== 1){
            throwException('"expect" requires 1 argument, found ' + arguments.length);
        }
        //push partial assertion (only the value) info onto the assertion table
        pushOntoAssertions(null, null, actual, null, null);
        //return assert for chaining
        return assert;
    }

    //only used by mock.validate and not part of the public api
    function noteMockHasExpectations(){
        if(arguments.length){
            throwException('matcher "toHaveBeenCalled" expects no arguments, found ' + arguments.length);
        }

        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertMockHasExpectations, null, stackTraceFromError(), a.value._hasExpectations);
    }

    function noteToHaveBeenCalled(){
        if(arguments.length){
            throwException('matcher "toHaveBeenCalled" expects no arguments, found ' + arguments.length);
        }

        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToHaveBeenCalled, null, stackTraceFromError(), a.value.calls.count() > 0);
    }

    function noteToNotHaveBeenCalled(){
        if(arguments.length){
            throwException('matcher "toNotHaveBeenCalled" expects no arguments, found ' + arguments.length);
        }

        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToNotHaveBeenCalled, null, stackTraceFromError(), a.value.calls.count() > 0);
    }

    function noteToHaveBeenCalledWith(){
        if(!arguments.length){
            throwException('matcher "toHaveBeenCalledWith" expects 1 or more arguments, found none');
        }

        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToHaveBeenCalledWith, argsToArray(arguments), stackTraceFromError(),
            a.value.calls.wasCalledWith.apply(null, arguments));
    }

    function noteToNotHaveBeenCalledWith(){
        if(!arguments.length){
            throwException('matcher "toNotHaveBeenCalledWith" expects 1 or more arguments, found none');
        }

        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToNotHaveBeenCalledWith, argsToArray(arguments), stackTraceFromError(),
            a.value.calls.wasCalledWith.apply(null, arguments));
    }

    function noteToHaveBeenCalledWithContext(context){
        if(arguments.length !== 1){
            throwException('matcher "toHaveBeenCalledWithContext" expects 1 arguments, found ' + arguments.length);
        }

        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToHaveBeenCalledWithContext, context, stackTraceFromError(), a.value.calls.wasCalledWithContext(context));
    }

    function noteToNotHaveBeenCalledWithContext(context){
        if(arguments.length !== 1){
            throwException('matcher "toHaveBeenCalledWithContext" expects 1 arguments, found ' + arguments.length);
        }

        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToNotHaveBeenCalledWithContext, context, stackTraceFromError(), a.value.calls.wasCalledWithContext(context));
    }

    function noteToHaveReturned(value){
        if(arguments.length !== 1){
            throwException('matcher "toHaveReturned" expects 1 arguments, found none');
        }
        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToHaveReturned, value, stackTraceFromError(), a.value.calls.returned(value));
    }

    function noteToNotHaveReturned(value){
        if(arguments.length !== 1){
            throwException('matcher "toHaveReturned" expects 1 arguments, found none');
        }
        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToNotHaveReturned, value, stackTraceFromError(), a.value.calls.returned(value));
    }

    function noteToHaveThrown(){
        if(arguments.length){
            throwException('matcher "toHaveThrown" expects no arguments, found ' + arguments.length);
        }
        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToHaveThrown, true, stackTraceFromError(), a.value.calls.threw());
    }

    function noteToNotHaveThrown(){
        if(arguments.length){
            throwException('matcher "toNotHaveThrown" expects no arguments, found ' + arguments.length);
        }
        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToNotHaveThrown, true, stackTraceFromError(), a.value.calls.threw());
    }

    function noteToHaveThrownWithName(value){
        if(arguments.length !== 1){
            throwException('matcher "toHaveThrownWithName" requires 1 argument, found ' + arguments.length);
        }
        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToHaveThrownWithName, value, stackTraceFromError(), a.value.calls.threwWithName(value));
    }

    function noteToNotHaveThrownWithName(value){
        if(arguments.length !== 1){
            throwException('matcher "toNotHaveThrownWithName" requires 1 argument, found ' + arguments.length);
        }
        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToNotHaveThrownWithName, value, stackTraceFromError(), a.value.calls.threwWithName(value));
    }

    function noteToHaveThrownWithMessage(value){
        if(arguments.length !== 1){
            throwException('matcher "toHaveThrownWithMessage" requires 1 argument, found ' + arguments.length);
        }
        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToHaveThrownWithMessage, value, stackTraceFromError(), a.value.calls.threwWithMessage(value));
    }

    function noteToNotHaveThrownWithMessage(value){
        if(arguments.length !== 1){
            throwException('matcher "toNotHaveThrownWithMessage" requires 1 argument, found ' + arguments.length);
        }
        var ti = testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        completeTheAssertion(assertToNotHaveThrownWithMessage, value, stackTraceFromError(), a.value.calls.threwWithMessage(value));
    }

    function noteToEqualAssertion(value){
        if(arguments.length !== 1){
            throwException('matcher "toEqual" requires 1 argument, found ' + arguments.length);
        }
        completeTheAssertion(assertEqual, value, stackTraceFromError());
    }

    function noteToNotEqualAssertion(value){
        if(arguments.length !== 1){
            throwException('matcher "toNotEqual" requires 1 argument, found ' + arguments.length);
        }
        completeTheAssertion(assertNotEqual, value, stackTraceFromError());
    }

    function noteToBeTrueAssertion(){
        if(arguments.length){
            throwException('matcher "toBeTrue;" expects no arguments, found ' + arguments.length);
        }
        completeTheAssertion(assertIsTrue, true, stackTraceFromError());
    }

    function noteToBeFalseAssertion(){
        if(arguments.length){
            throwException('matcher "toBeFalse;" expects no arguments, found ' + arguments.length);
        }
        completeTheAssertion(assertIsFalse, true, stackTraceFromError());
    }

    function noteToBeTruthyAssertion(){
        if(arguments.length){
            throwException('matcher "toBeTruthy" expects no arguments, found ' + arguments.length);
        }
        completeTheAssertion(assertIsTruthy, true, stackTraceFromError());
    }

    function noteToNotBeTruthyAssertion(){
        if(arguments.length){
            throwException('matcher "toNotBeTruthy" expects no arguments, found ' + arguments.length);
        }
        completeTheAssertion(assertIsNotTruthy, true, stackTraceFromError());
    }

    function Assert(){this.not = new Not();}
    Assert.prototype = {
        constructor: Assert,
        toEqual: noteToEqualAssertion,
        toBeTrue: noteToBeTrueAssertion,
        toBeTruthy: noteToBeTruthyAssertion,
        toHaveBeenCalled: noteToHaveBeenCalled,
        toHaveBeenCalledWith: noteToHaveBeenCalledWith,
        toHaveBeenCalledWithContext: noteToHaveBeenCalledWithContext,
        toHaveReturned: noteToHaveReturned,
        toHaveThrown: noteToHaveThrown,
        toHaveThrownWithName: noteToHaveThrownWithName,
        toHaveThrownWithMessage: noteToHaveThrownWithMessage
    };

    function Not(){}
    Not.prototype = {
        constructor: Not,
        toEqual: noteToNotEqualAssertion,
        toBeTrue: noteToBeFalseAssertion,
        toBeTruthy: noteToNotBeTruthyAssertion,
        toHaveBeenCalled: noteToNotHaveBeenCalled,
        toHaveBeenCalledWith: noteToNotHaveBeenCalledWith,
        toHaveBeenCalledWithContext: noteToNotHaveBeenCalledWithContext,
        toHaveReturned: noteToNotHaveReturned,
        toHaveThrown: noteToNotHaveThrown,
        toHaveThrownWithName: noteToNotHaveThrownWithName,
        toHaveThrownWithMessage: noteToNotHaveThrownWithMessage
    };

    //Returns the ui test container element.
    function getUiTestContainerElement(){
        return document.getElementById(config.uiTestContainerId);
    }

    //Returns the id of the ui test container element.
    function getUiTestContainerElementId(){
        return config.uiTestContainerId;
    }

    spy = (function() {
        function _spy(argObject, argProperty){
            var targetFn,
                snoopster,
                calls = [];
            if(arguments.length){
                if(typeof(argObject) !== 'function' &&
                    typeof(argObject) !== 'object'){
                    throw new Error('1st parameter must be a function or an object');
                }
                if(typeof(argObject) === 'object' && arguments.length < 2){
                    throw new Error('expecting 2 parameters - found ' + arguments.length);
                }
                if(typeof(argObject) === 'object' && typeof(argProperty) !== 'string'){
                    throw new Error('2nd parameter must be a string');
                }
                if(typeof(argObject) === 'object' && typeof(argObject[argProperty]) !== 'function'){
                    throw new Error('expected ' + argProperty + ' to be a method');
                }
            }
            //spy api
            function Args(aArgs){
                this.args = aArgs;
            }
            Args.prototype.getLength = function(){
                return  this.args.length ? this.args.length : 0;
            };
            Args.prototype.hasArg = function(i){
                return this.getLength() > i ? true : false;
            };
            Args.prototype.getArg = function(i){
                return this.hasArg(i) ? this.args[i] : null;
            };
            Args.prototype.hasArgProperty = function(i, propertyName){
                return this.hasArg(i) && this.args[i][propertyName] ? true : false;
            };
            Args.prototype.getArgProperty = function(i, propertyName){
                return this.hasArgProperty(i, propertyName) ? this.args[i][propertyName] : null;
            };
            //spy api
            function ACall(context, args, error, returned){
                this.context = context;
                this.args = args;
                this.error = error;
                this.returned = returned;
            }
            ACall.prototype.getContext = function(){
                return this.context;
            };
            ACall.prototype.getArgs = function(){
                return this.args;
            };
            ACall.prototype.getArg = function(i){
                return this.args.getArg(i);
            };
            ACall.prototype.getArgsLength = function(){
                return this.args.getLength();
            };
            ACall.prototype.getArgProperty = function(i, propertyName){
                return this.args.getArgProperty(i, propertyName);
            };
            ACall.prototype.hasArgProperty = function(i, propertyName){
                return this.args.hasArgProperty(i, propertyName);
            };
            ACall.prototype.hasArg = function(i){
                return this.args.hasArg(i);
            };
            ACall.prototype.getError = function(){
                return this.error;
            };
            ACall.prototype.getReturned = function(){
                return this.returned;
            };
            targetFn = arguments.length === 0 ? function(){} :
                typeof(arguments[0]) === 'function' ? argObject :
                argObject[argProperty];
            //spy api - tracking
            snoopster = function(){
                var aArgs = arguments.length && argsToArray(arguments) || [],
                    fn,
                    error,
                    returned;
                function ThrowsException(message, name){
                    this.message = message;
                    this.name = name;
                }
                if(snoopster._callActual || snoopster._callFake){
                    fn = snoopster._callFake || targetFn;
                    try{
                        returned = fn.apply(snoopster._callWithContext || this, aArgs);
                    }catch(er){
                        error = er;
                    }
                }else if(snoopster._throws){
                    try{

                        throw new ThrowsException(snoopster._throwsMessage, snoopster._throwsName);
                    }catch(er){
                        error = er;
                    }
                }
                if(!snoopster._callActual){
                    returned = snoopster._returns || returned;
                }
                // snoopster.args = new Args(aArgs);
                calls.push(new ACall(snoopster._callWithContext || this, new Args(aArgs), error, returned));
                return returned;
            };
            snoopster._snoopsterMaker = 'preamble.snoopster';
            //stub api
            snoopster._throws = false;
            snoopster._throwsMessage = '';
            snoopster._throwsName = '';
            snoopster.and = {};
            //spy api - sets the spy back to its default state
            snoopster.and.reset = function() {
                calls = [];
                snoopster._resetCalls();
                snoopster._throws = false;
                snoopster._throwsMessage = '';
                snoopster._throwsName = '';
                snoopster._callWithContext = null;
                snoopster._hasExpectations = false;
                snoopster._expectations = {};
                return snoopster;
            };
            snoopster._callWithContext = null;
            snoopster.and.callWithContext = function(context){
                if(!context || typeof(context) !== 'object'){
                    throw new Error('callWithContext expects to be called with an object');
                }
                snoopster._callWithContext = context;
                return snoopster;
            };
            snoopster.and.throw = function(){
                snoopster._throws = true;
                //for chaining
                return snoopster;
            };
            snoopster.and.throwWithMessage = function(message){
                if(typeof(message) !== 'string'){
                    throw new Error('message expects a string');
                }
                snoopster._throws = true;
                snoopster._throwsMessage = message;
                //for chaining - spy.throws.with.message().and.with.name();
                return snoopster;
            };
            snoopster.and.throwWithName = function(name){
                if(typeof(name) !== 'string'){
                    throw new Error('name expects a string');
                }
                snoopster._throws = true;
                snoopster._throwsName = name;
                //for chaining - spy.throws.with.message().and.with.name();
                return snoopster;
            };
            snoopster.and.return = function(ret){
                snoopster._returns = ret;
                //for chaining
                return snoopster;
            };
            //spy api
            snoopster._resetCalls = function(){
                snoopster._callFake = null;
                snoopster._callActual = this._callStub = false;
            };
            //spy api
            snoopster._callFake = null;
            snoopster.and.callFake = function(fn){
                if(fn && typeof(fn) !== 'function'){
                    throw new Error('callFake expects to be called with a function');
                }
                snoopster._resetCalls();
                snoopster._callFake = fn;
                return snoopster;
            };
            //spy api
            snoopster._callActual = false;
            snoopster.and.callActual = function(){
                snoopster._resetCalls();
                snoopster._callActual = true;
                //for chaining
                return snoopster;
            };
            //spy api
            snoopster.and.callStub = function(){
                snoopster._resetCalls();
                snoopster._callActual = false;
                //for chaining
                return snoopster;
            };
            snoopster.calls = {
                count: function(){
                    return calls.length;
                },
                forCall: function(i){
                    return i >= 0 && i < calls.length && calls[i] || undefined;
                },
                all: function(){
                    return calls;
                },
                wasCalledWith: function(){
                    var a = argsToArray(arguments);
                    return calls.some(function(call){
                        var args = call.getArgs().args;
                        return(a_equals_b(a, args));
                    });
                },
                wasCalledWithContext: function(obj){
                    return calls.some(function(call){
                        var context = call.context;
                        return(a_equals_b(obj, context));
                    });
                },
                returned: function(value){
                    return calls.some(function(call){
                        var returned = call.getReturned();
                        return(a_equals_b(value, returned));
                    });
                },
                threw: function(){
                    return calls.some(function(call){
                        return !!call.error;
                    });
                },
                threwWithName: function(name){
                    return calls.some(function(call){
                        return call.error && call.error.name === name;
                    });
                },
                threwWithMessage: function(message){
                    return calls.some(function(call){
                        return call.error && call.error.message === message;
                    });
                }
            };
            //mock api
            snoopster._hasExpectations = false;
            snoopster._expectations = {};
            snoopster.and.expect = {it: {}};
            snoopster.and.expect.it.toBeCalled = function(){
                snoopster._hasExpectations = true;
                snoopster._expectations.toBeCalled = true;
                return snoopster;
            };
            snoopster.and.expect.it.toBeCalledWith = function(){
                snoopster._hasExpectations = true;
                snoopster._expectations.toBeCalledWith = arguments;
                return snoopster;
            };
            snoopster.and.expect.it.toBeCalledWithContext = function(obj){
                snoopster._hasExpectations = true;
                snoopster._expectations.toBeCalledWithContext = obj;
                return snoopster;
            };
            snoopster.and.expect.it.toReturn = function(value){
                snoopster._hasExpectations = true;
                snoopster._expectations.toReturn = value;
                return snoopster;
            };
            snoopster.and.expect.it.toThrow = function(){
                snoopster._hasExpectations = true;
                snoopster._expectations.toThrow = true;
                return snoopster;
            };
            snoopster.and.expect.it.toThrowWithName = function(name){
                snoopster._hasExpectations = true;
                snoopster._expectations.toThrowWithName = name;
                return snoopster;
            };
            snoopster.and.expect.it.toThrowWithMessage = function(message){
                snoopster._hasExpectations = true;
                snoopster._expectations.toThrowWithMessage = message;
                return snoopster;
            };
            snoopster.validate = function(){
                // if(!snoopster._hasExpectations){
                //     throwException('"validate" expects a spy with predefined expectation and found none');
                // }
                //Expect the mock to have expectations
                noteExpectation(snoopster);
                noteMockHasExpectations();
                if(snoopster._expectations.toBeCalled){
                    noteExpectation(snoopster);
                    noteToHaveBeenCalled();
                }
                if(snoopster._expectations.toBeCalledWith){
                    noteExpectation(snoopster);
                    noteToHaveBeenCalledWith.apply(null, argsToArray(snoopster._expectations.toBeCalledWith));
                }
                if (snoopster._expectations.toBeCalledWithContext){
                    noteExpectation(snoopster);
                    noteToHaveBeenCalledWithContext(snoopster._expectations.toBeCalledWithContext);
                }
                if(snoopster._expectations.toReturn){
                    noteExpectation(snoopster);
                    noteToHaveReturned(snoopster._expectations.toReturn);
                }
                if(snoopster._expectations.toThrow){
                    noteExpectation(snoopster);
                    noteToHaveThrown();
                }
                if(snoopster._expectations.toThrowWithName){
                    noteExpectation(snoopster);
                    noteToHaveThrownWithName(snoopster._expectations.toThrowWithName);
                }
                if(snoopster._expectations.toThrowWithMessage){
                    noteExpectation(snoopster);
                    noteToHaveThrownWithMessage(snoopster._expectations.toThrowWithMessage);
                }
            };
            if(arguments.length && typeof(arguments[0]) !== 'function' &&
                typeof(arguments[0]) === 'object'){
                argObject[argProperty] = snoopster;
            }
            return snoopster;
        }
        /**
         * @param {object} argObject An object whose properties identified by
         * the elements in argPropertyNames are to be spies.
         * @param {array} argPropertyNames An array of strings whose elements
         * identify the methods in argObject to be spies.
         * @param {[object]} context An object to use as the context when calling
         * the spied property methods.
         */
        _spy.x = function(argObject, argPropertyNames){
            var i,
                len;
            if(!argObject || typeof(argObject) !== 'object'){
                throw new Error('expected an object for 1st parameter - found ' +
                    typeof(argObject));
            }
            if(!argPropertyNames || !Array.isArray(argPropertyNames)){
                throw new Error('expected an array for 2nd parameter - found ' +
                    typeof(argObject));
            }
            if(!argPropertyNames.length){
                throw new Error('expected an array for 2nd parameter with at ' +
                    'least one element for 2nd parameter');
            }
            for(i = 0, len = argPropertyNames.length; i < len; i++){
                if(typeof(argPropertyNames[i]) !== 'string'){
                    throw new Error('expected element ' + i +
                    ' of 2nd parameter to be a string');
                }
                if(!argObject[argPropertyNames[i]]){
                    throw new Error('expected 1st paramter to have property ' +
                        argPropertyNames[i]);
                }
                if(typeof(argObject[argPropertyNames[i]]) !== 'function'){
                    throw new Error('expected ' + argPropertyNames[i] +
                        ' to be a method');
                }
            }
            argPropertyNames.forEach(function(property){
                spy(argObject, property);
            });
        };
        return _spy;
    }());

    /**
     * It all starts here!
     */

    //Record the start time.
    queue.start = Date.now();

    //Create a reporter.
    reporter = new HtmlReporter(showHidePassedTests);

    //Configure the runtime environment.
    configure();

    /**
     * Wait while the queue is loaded.
     */
    try{
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
