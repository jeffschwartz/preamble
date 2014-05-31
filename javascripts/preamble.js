//Preamble 2.0.0 (Ramoth)
//(c) 2013 Jeffrey Schwartz
//Preamble may be freely distributed under the MIT license.
(function(window, undefined){
    'use strict';

    //Version
    var version = 'v2.0.0 (Ramoth) RC',
        //Merged configuration options.
        config = {},
        queue=[],
        isShortCircuited = false, //Can only be true if config.shortCircuit is true and a test has failed.
        prevQueueCount = 0,
        queueStableCount = 0,
        queueStableInterval = 1,
        reFileFromStackTrace = /file:\/\/\/\S+\.js:[0-9]+[:0-9]*/g,
        reporter,
        assert,
        intervalId,
        runtimeFilter,
        stackTraceProperty,
        queueBuilder,
        pubsub,
        tests,
        testsIterator;

    //Polyfil for bind - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
   //Required when using phantomjs - its javascript vm doesn't currently support Function.prototype.bind.
    //TODO(Jeff): remove polyfil once phantomjs supports bind!
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
     * @param {boolean} bypass
     */
    function Group(parentGroups, id, path, label, callback, bypass){
        this.parentGroups = parentGroups.slice(0); //IMPORTANT: make a "copy" of the array
        this.id = id;
        this.path = path;
        this.label = label; 
        this.callback = callback;
        this.bypass = bypass;
        this.duration = 0;
        this.passed = true;
    }

    /**
     * A test.
     * @constructor
     * @param {[Group] parentGroups
     * @param {string} path
     * @param {string} label
     * @param {integer} asyncTestDelay
     * @param {function} callback
     * @param {boolean} bypass
     */
    function Test(parentGroups, id, path, label, stackTrace, asyncTestDelay, callback, bypass){
        this.parentGroups = parentGroups.slice(0); //IMPORTANT: make a "copy" of the array
        this.parentGroup = parentGroups[parentGroups.length - 1];
        this.id = id;
        this.path = path;
        this.label = label;
        this.stackTrace = stackTrace;
        this.asyncTestDelay = asyncTestDelay;
        this.callback = callback;
        this.bypass = bypass;
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
     * Test runner
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
            if(self.callback.length){
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
            }, test.asyncTestDelay);

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
     * Runs assertions
     */
    Test.prototype.runAssertions = function(){
        var i,
            len,
            item,
            result;
        this.totFailed = 0;
        for (i = 0, len = this.assertions.length; i < len; i++) {
            item = this.assertions[i];
            result = item.assertion(typeof item.value === 'function' ? item.value() : item.value, item.expectation);
            item.result = result.result;
            this.totFailed = item.result ? this.totFailed : this.totFailed += 1;
            //this.parentGroup.passed = this.totFailed ? false : this.parentGroup.passed;
            item.explain = result.explain;
            //TODO(Jeff): Implement short circuit as this will not work.
            //if(config.shortCircuit && !item.result){
            //    isShortCircuited = this.isShortCircuited = item.isShortCircuited = true;
            //    return;
            //}
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
     * HtmlReporter
     * @constructor
     */
    function HtmlReporter(){
        this.preambleTestContainer = document.getElementById('preamble-test-container');
        this.preambleUiContainer = document.getElementById('preamble-ui-container');
        this.init();
        on('configchanged', function(topic, args){
            //Add structure to the document and show the header.
            this.updateHeader(args.name, version, args.uiTestContainerId);
        }, this);
    }

    /**
     * Add structure to the DOM/show the header.
     */
    HtmlReporter.prototype.init = function(){
        var s = '<header>' + 
                    '<div class="banner">' + 
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
                    '</div>' + 
                    '<div id="time">' + 
                        '<span>Completed in ' + 
                            '<span title="total time to completion">' + 
                                '{{tt}}ms' + 
                            '</span>' + 
                        '</span>' + 
                    '</div>' + 
                '</header>' +
                '<div class="container">' + 
                    '<section id="preamble-status-container">' + 
                        '<div class="summary">Building queue. Please wait...</div>' + 
                    '</section>' + 
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
        var show = runtimeFilter.group || config.filters.length ? 'Filtered' : 'Covered',
            elStatusContainer = document.getElementById('preamble-status-container'),
            coverage = '<div id="coverage">' + show + ' {{tt}}' +
                '<div class="hptui"><label for="hidePassedTests">Hide passed tests</label>' + 
                '<input id="hidePassedTests" type="checkbox" {{checked}}></div>' +
                ' - <a id="runAll" href="?"> run all</a>' +
                '</div>',
            hpt;
        //Show groups and tests coverage in the header.
        coverage = coverage.replace(/{{tt}}/, tests.length + pluralize(' test', tests.length));
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
        el.style.display = 'block';
        if(tests.result){
            html = '<div id="preamble-results-summary-passed" class="summary-passed">' + tests.length + pluralize(' test', tests.length ) + ' passed' + '</div>';
        }else{
            html = '<div id="preamble-results-summary-failed" class="summary-failed">' + tests.totTestsFailed + pluralize(' test', tests.totTestsFailed) + ' failed.</div>';
        }
        document.getElementById('preamble-status-container').insertAdjacentHTML('beforeend', html);
    };

    /**
     * Show details.
     * @param {array} tests An array of Tests.
     */
    HtmlReporter.prototype.details = function(queue){
        var rc = document.getElementById('preamble-results-container'),
            hidePassed = document.getElementById('hidePassedTests').checked,
            groupContainerMarkup = '<ul class="group-container{{hidden}}" data-passed="{{passed}}" id="{{id}}"></ul>',
            groupAnchorMarkup = '<li><a class="group{{passed}}" href="{{path}}" title="Click here to filter by this group.">{{label}}</a></li>',
            testContainerMarkup = '<ul class="tests-container{{hidden}}" data-passed="{{passed}}"></ul>',
            testAnchorMarkup = '<li><a class="{{passed}}" href="{{path}}" title="Click here to filter by this test.">{{label}}</a></li>',
            testFailureMarkup = '<ul class="stacktrace-container failed bold"><li class="failed bold">Error: "{{explain}}" and failed</li><li class="failed bold">{{stacktrace}}</li></ul>',
            html = '',
            failed = '',
            parentGroup,
            el,
            as,
            i,
            len;
        queue.forEach(function(item){
            if(item instanceof(Group)){
                //Add groups to the DOM.
                html = '' + groupContainerMarkup.
                    replace(/{{hidden}}/, hidePassed && item.passed && ' hidden' || '').
                    replace(/{{passed}}/, item.passed).
                    replace(/{{id}}/, item.path);
                html = html.slice(0, -5) + groupAnchorMarkup.
                    replace(/{{passed}}/, item.passed ? '' : ' failed').
                    replace('{{path}}', item.path).
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
                    replace(/{{hidden}}/, hidePassed && item.totFailed === 0 ? ' hidden' : '').
                    replace(/{{passed}}/, item.totFailed ? 'false' : 'true');
                html = html.slice(0, -5) + testAnchorMarkup.
                    replace(/{{passed}}/, item.totFailed ? 'failed' : 'passed').
                    replace('{{path}}', item.path).
                    replace(/{{label}}/, item.label) + html.slice(-5);
                //Show failed assertions and their stacks.
                if(item.totFailed > 0){
                    item.assertions.forEach(function(assertion){
                        if(!assertion.result){
                            failed = testFailureMarkup.
                                replace(/{{explain}}/, assertion.explain).
                                replace(/{{stacktrace}}/, stackTrace(assertion.stackTrace));
                        }
                    });
                    html = html.slice(0, -5) + failed + html.slice(-5);
                }else if(item.totFailed === -1){
                    failed = testFailureMarkup.
                        replace(/{{explain}}/, 'test timed out').
                        replace(/{{stacktrace}}/, stackTrace(item.stackTrace));
                    html = html.slice(0, -5) + failed + html.slice(-5);
                }
                el = document.getElementById(item.parentGroup.path);
                el.insertAdjacentHTML('beforeend', html);
            }    
        });
        document.getElementById('preamble-results-container').style.display = 'block';
        domAddEventHandler(document.getElementById('hidePassedTests'), 'click', hptClickHandler);
        ////TODO(Jeff): Should use event delegation here!
        as = document.getElementsByTagName('a');
        for(i = 0, len = as.length; i < len; i++){
            domAddEventHandler(as[i], 'click', runClickHandler);
        }
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
                boundAsyncHandler = context && makeAsync(topic, bindTo(handler, context)) || makeAsync(topic, handler);
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
        //TODO(Jeff): comment out next line.
        window.queue = queue;
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
            //TODO(Jeff): this should throw with a message that there are no tests to run.
            emit('end');
        }
    });

    on('runTests', function(topic, callback){
        testsIterator = iteratorFactory(tests);

        function runTest(test, callback){
            test.run(function(){
                callback();
            });
        }

        function runTests(callback){
            if(testsIterator.hasNext()){
                runTest(testsIterator.getNext(), function(){
                    runTests(callback);
                });
            }else{
                callback();
            }
        }

        runTests(function(){
            callback();
        });
    });

    on('end', function(){
        //TODO(Jeff): comment out next line.
        window.tests = tests;
        //TODO(Jeff): comment out next line.
        window.failedTests = tests.filter(function(t){
            return t.totFailed || t.timedOut;
        });
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

    /**
     * An iterator for iterating over arrays.
     * @param {array} argArray The array to be iterated over.
     */
    function iteratorFactory(argArray){
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
            return argArray.length && currentIndex >= 0 && currentIndex < argArray.length && argArray[currentIndex];
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

        function filter(arg1, arg2){
            return true;
        }

        runner.group = function(label, callback){
            var grp,
                id,
                path;
            if(arguments.length !== 2){
                throwException('requires 2 arguments, found ' + arguments.length);
            }
            id = uniqueId();
            path = groupStack.getPath() + '/' + id;
            grp = new Group(groupStack, id, path, label, callback, !filter('group', {group: label}));
            queue.push(grp);
            groupStack.push(grp);
            grp.callback();
            groupStack.pop();
        };

        runner.beforeEachTest = function(callback){
            var parentGroup = groupStack[groupStack.length - 1];
            parentGroup.beforeEachTest = callback;
        };

        runner.afterEachTest = function(callback){
            var parentGroup = groupStack[groupStack.length - 1];
            parentGroup.afterEachTest = callback;
        };

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
            tl = arguments.length === 3 && timeLimit || config.asyncTestDelay;
            cb = arguments.length === 3 && callback || arguments[1];
            parentGroup = groupStack[groupStack.length - 1];
            id = uniqueId();
            path = groupStack.getPath() + '/' + id;
            stackTrace = stackTraceFromError();
            tst = new Test(groupStack, id, path, label, stackTrace, tl, cb, !filter('test', {group: path, test: label}));
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
            el.addEventListener(event, handler);
        }else{
            el.attachEvent('on' + event, handler);
        }
    }

    /**
     * Click handler for the hide passed tests checkbox.
     */
    function hptClickHandler(){
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
                    if(attributes[ii] === 'group-container' || attributes[ii] === 'tests-container' || attributes[ii] === 'assertion-container'){
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

    //When the anchor tag "run all" is clicked, persist the hidePassedTests checkbox state as a query parameter.
    function runClickHandler(evt){
        var checked = document.getElementById('hidePassedTests').checked,
            lastChar,
            href;
        if(config.hidePassedTests !== checked){
            evt.preventDefault();
            href = evt.currentTarget.getAttribute('href');
            lastChar = href[href.length -1];
            lastChar = lastChar === '?' ? '' : '&';
            window.location = href + lastChar + 'hpt=' + checked;
        }
    }

    //Filtering.
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
            }
        }
    }

    //Configuration is called once internally but may be called again if test script employs in-line configuration.
    function configure(){
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
         *hidePassedTests: (default: false) - set to true to hide passed tests.
         *
         *hideAssertions: (default: true) - set to false to show assertions.
         *
         *filters: (default: []) - set 1 or more filters by adding hashes, e.g. {group: groupLabel, test: testLabel}.
         *You can also use the wildcard '*' character for test to specify that all tests should be included in the filter.
         *
         *autoStart: (default: true) - *IMPORTANT - FOR INTERNAL USE ONLY. Adapters for external processes, such as for Karma, 
         *initially set this to false to delay the execution of the tests and will eventually set it to true when appropriate.
         */
        var defaultConfig = {
                shortCircuit: false, 
                windowGlobals: true, 
                asyncTestDelay: 10, 
                asyncBeforeAfterTestDelay: 10, 
                name: 'Test', 
                uiTestContainerId: 'ui-test-container', 
                hidePassedTests: false,
                hideAssertions: true,
                filters: [],
                autoStart: true
            },
            configArg = arguments && arguments[0];
        //Ignore configuration once testing has started.
        if(configArg && queue.length){
            return;
        }
        config = window.preambleConfig ? merge(defaultConfig, window.preambleConfig) : defaultConfig;
        config = configArg ? merge(config, configArg) : config;
        //Capture run-time filters, if any. Run-time filters take precedent over configuration filters.
        runtimeFilter = {group: loadPageVar('group'), test: loadPageVar('test')};
        //Capture exception's stack trace property.
        setStackTraceProperty();
        //Handle global errors.
        window.onerror = errorHandler;
        //If the windowGlabals config option is false then window globals will
        //not be used and the one Preamble name space will be used instead.
        if(config.windowGlobals){
            window.configure = configure;
            window.group = queueBuilder.group;
            window.when = queueBuilder.group;
            window.beforeEach = queueBuilder.beforeEachTest;
            window.afterEach = queueBuilder.afterEachTest;
            window.test = queueBuilder.test;
            window.then = queueBuilder.test;
            window.equal = noteEqualAssertion;
            window.notEqual = noteNotEqualAssertion;
            window.isTrue = noteIsTrueAssertion;
            window.isFalse = noteIsFalseAssertion;
            window.isTruthy = noteIsTruthyAssertion;
            window.isNotTruthy = noteIsNotTruthyAssertion;
            window.getUiTestContainerElement = getUiTestContainerElement;
            window.getUiTestContainerElementId = getUiTestContainerElementId;
            window.proxy = proxy;
            window.snoop = snoop;
        }else{
            window.Preamble = {
                configure: configure,
                group: queueBuilder.group,
                when: queueBuilder.group,
                beforeEach: queueBuilder.beforeEachTest,
                afterEach: queueBuilder.afterEachTest,
                test: queueBuilder.test,
                then: queueBuilder.test,
                getUiTestContainerElement: getUiTestContainerElement,
                getUiTestContainerElementId: getUiTestContainerElementId,
                proxy: proxy,
                snoop: snoop
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

    //function showResultsDetails(results){
    //    var groupLabel = '',
    //        testLabel = '',
    //        html = '', 
    //        //Hide passed tests.
    //        hidePassed = document.getElementById('hidePassedTests').checked,
    //        //Titles for anchor tags.
    //        groupTile = 'title="Click here to filter by this group."',
    //        testTitle = 'title="Click here to filter by this test."',
    //        as,
    //        i,
    //        len;
    //    document.getElementById('preamble-results-container').style.display = 'block';
    //    results.forEach(function(result){
    //        //Concat group and label when comparing to avoid collisions with the previous test should it have the same label.
    //        if(result.groupLabel + result.testLabel !== groupLabel + testLabel){
    //            if(html.length){
    //                html += '</div>';
    //            }
    //        }
    //        if(result.groupLabel !== groupLabel){
    //            if(html.length){
    //                html += '</div>';
    //            }
    //        }
    //        if(result.groupLabel !== groupLabel){
    //            html += '<div class="group-container' + (hidePassed && result.groupResult ? ' hidden' : '') + 
    //                '" ' + 'data-passed="' + result.groupResult + '"><a class="group' + (!result.groupResult ? ' failed' : '') + '" href="?group=' +
    //                encodeURI(result.groupLabel) + '" ' + groupTile + '>' + result.groupLabel + ' (' + result.groupDuration + 'ms)' + '</a>';
    //            groupLabel = result.groupLabel;
    //            testLabel = '';
    //        }
    //        if(result.groupLabel + result.testLabel !== groupLabel + testLabel){
    //            html += '<div class="tests-container' + (hidePassed && result.testResult ? ' hidden' : '') +
    //                '" ' + 'data-passed="' + result.testResult + '"><a class="' + (!result.testResult ? ' failed' : 'passed') + '" href="?group=' +
    //                encodeURI(result.groupLabel) + '&test=' + encodeURI(result.testLabel) + '" ' + testTitle + '>' + result.testLabel + 
    //                ' (' + result.testDuration + 'ms)' + '</a>';
    //            testLabel = result.testLabel;
    //        }
    //        //When evaluating and using result.result here, it first has to be converted into a boolean using either !result.result or !!result.result.
    //        //(Using '!!', a.k.a. the double bang, converts result.result into a boolean value via result.result's truthyness.)
    //        //This is because result.result isn't restricted to boolean true/false, and can be any valid JavaScript primitive or object.
    //        //For example, result.result is an object and not a boolen when isTruthy({},..) is called.
    //        if(!result.result){
    //            html += '<div class="assertion-container' + (hidePassed && !!result.result ? ' hidden' : '') + 
    //                '" ' + 'data-passed="' + !!result.result + '"><div class="assertion failed"' + '>Error: "' +
    //                result.explain + '" failed:</div></div><div class="stacktrace-container failed bold">' + stackTrace(result.stackTrace) + '</div>';
    //        }else{
    //            if(!config.hideAssertions){
    //                html += '<div class="assertion-container' + (hidePassed && !!result.result ? ' hidden' : '') + 
    //                    '" ' + 'data-passed="' + !!result.result + '"><div class="assertion passed"' + '>' +
    //                    result.explain + ' passed</div></div>';
    //            }
    //        }
    //    });
    //    html += '</div></div>';
    //    document.getElementById('preamble-results-container').innerHTML = html;
    //    domAddEventHandler(document.getElementById('hidePassedTests'), 'click', hptClickHandler);
    //    //TODO(Jeff): Should use event delegation here!
    //    as = document.getElementsByTagName('a');
    //    for(i = 0, len = as.length; i < len; i++){
    //        domAddEventHandler(as[i], 'click', runClickHandler);
    //    }
    //}

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
        //return a_equals_b(a, b);
        var result = a_equals_b(a, b);
        return {result: result, explain: 'expected ' + JSON.stringify(a) + ' to equal ' + JSON.stringify(b)};
    }

    //"strict" a === true, simple boolean test
    function assertIsTrue(a){
        //return a_equals_true(a);
        var result = a_equals_true(a);
        return {result: result, explain: 'expected ' + JSON.stringify(a) + ' to be true'};
    }

    //"non strict" a == true, simple boolean test
    function assertIsTruthy(a){
        //return a_is_truthy(a);
        var result = a_is_truthy(a);
        return {result: result, explain: 'expected ' + JSON.stringify(a) + ' to be truthy'};
    }

    //"strict" a !== b
    function assertNotEqual(a, b){
        //return a_notequals_b(a, b);
        var result = a_notequals_b(a, b);
        return {result: result, explain: 'expected ' + JSON.stringify(a) + ' to not equal ' + JSON.stringify(b)};
    }

    //"strict" a === false, simple boolean test
    function assertIsFalse(a){
        //return a_equals_false(a);
        var result = a_equals_false(a);
        return {result: result, explain: 'expected ' + JSON.stringify(a) + ' to be false'};
    }

    //"non strict" a == true, simple boolean test
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

    function noteEqualAssertion(value, expectation, label){
        if(arguments.length < 2){
            throwException('Assertion "equal" requires 2 arguments, found ' + arguments.length);
        }
        pushOntoAssertions(assertEqual, label, value, expectation, stackTraceFromError());
    }

    function noteIsTrueAssertion(value, label){
        if(arguments.length < 1){
            throwException('Assertion "isTrue" requires 1 argument, found ' + arguments.length);
        }
        pushOntoAssertions(assertIsTrue, label, value, true, stackTraceFromError());
    }

    function noteIsTruthyAssertion(value, label){
        if(arguments.length < 1){
            throwException('Assertion "isTruthy" requires 1 argument, found ' + arguments.length);
        }
        pushOntoAssertions(assertIsTruthy, label, value, true, stackTraceFromError());
    }

    function noteNotEqualAssertion(value, expectation, label){
        if(arguments.length < 2){
            throwException('Assertion "notEqual" requires 2 arguments, found ' + arguments.length);
        }
        pushOntoAssertions(assertNotEqual, label, value, expectation, stackTraceFromError());
    }

    function noteIsFalseAssertion(value, label){
        if(arguments.length < 1){
            throwException('Assertion "isFalse" requires 1 argument, found ' + arguments.length);
        }
        pushOntoAssertions(assertIsFalse, label, value, true, stackTraceFromError());
    }

    function noteIsNotTruthyAssertion(value, label){
        if(arguments.length < 1){
            throwException('Assertion "isNotTruthy" requires 1 argument, found ' + arguments.length);
        }
        pushOntoAssertions(assertIsNotTruthy, label, value, true, stackTraceFromError());
    }

    //Returns the ui test container element.
    function getUiTestContainerElement(){
        return document.getElementById(config.uiTestContainerId);
    }

    //Returns the id of the ui test container element.
    function getUiTestContainerElementId(){
        return config.uiTestContainerId;
    }

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
                //If n is within bounds returns the after used on the nth
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

    function snoop(argObject, argProperty){
        var targetFn,
            snoopster,
            calls = [];
        window.calls = calls;
        function argsToArray(argArguments){
            return [].slice.call(argArguments, 0);
        }
        if(arguments.length !== 2){
            throw new Error('snoop requires 2 arguments, an object and a property name');
        }
        if(!arguments[0].hasOwnProperty([arguments[1]])){
            throw new Error('object does not have property name "' + arguments[1] + '"');
        }
        function Args(args){
            this.args = argsToArray(args);
        }
        Args.prototype.getArgument = function(i){
            return i >= this.args.length ? null : this.args[i];
        };
        function ACall(context, args, error, returned){
            this.context = context;
            this.args = args;
            this.error = error;
            this.returned = returned;
        }
        targetFn = argObject[argProperty];
        //tracking
        snoopster = function(){
            var aArgs = arguments.length && argsToArray(arguments) || [];
            var error = null;
            var returned;
            try{
                returned = targetFn.apply(this, aArgs);
            }catch(er){
                error = er;
            }
            snoopster.args = new Args(aArgs);
            calls.push(new ACall(this, aArgs, error, returned));
        };
        //api
        snoopster.called = function(){
            return calls.length;
        };
        snoopster.wasCalled = function(){
            return !!calls.length;
        };
        snoopster.wasCalled.nTimes = function(count){
            if(arguments.length !== 1){
                throw new Error('wasCalled.nTimes expects to be called with an integer');
            }
            return calls.length === count;
        };
        snoopster.contextCalledWith = function(){
            return snoopster.wasCalled() && calls[calls.length - 1].context;
        };
        snoopster.returned = function(){
            return snoopster.wasCalled() && calls[calls.length - 1].returned || undefined;
        };
        snoopster.threw = function(){
            return snoopster.wasCalled() && !!calls[calls.length - 1].error;
        };
        snoopster.threw.withMessage = function(message){
            return snoopster.wasCalled() && calls[calls.length - 1].error.message === message;
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
            }
        };
        argObject[argProperty] = snoopster;
    }

    /**
     * It all starts here!
     */

    //Record the start time.
    queue.start = Date.now();

    //Create a reporter.
    reporter = new HtmlReporter();

    //Configure the runtime environment.
    configure();

    /**
     * Wait while the queue is loaded.
     */
    //Catch errors.
    try{
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
