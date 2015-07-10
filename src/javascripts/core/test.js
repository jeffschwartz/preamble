(function(){
    'use strict';
    var Iterator = require('./iterator.js'),
        emit = require('./emit.js');

    /**
     * A test.
     * @constructor
     * @param {[Group] parentGroups
     * @param {string} path
     * @param {string} label
     * @param {integer} timeoutInterval
     * @param {function} callback
     */
    function Test(parentGroups, id, path, label, stackTrace,
        timeoutInterval, callback, bWindowGlobals){
        if(!(this instanceof Test)){
            return new Test(parentGroups, id, path, label, stackTrace,
                timeoutInterval, callback);
        }
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
        this.bWindowGlobals = bWindowGlobals;

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
        var beforesIterator = new Iterator(this.befores),
            aftersIterator = new Iterator(this.afters),
            self = this,
            bWindowGlobals = this.bWindowGlobals;

        //run a before
        function runBefore(callback){
            var before = beforesIterator.getNext();
            if(before.length){
                //call it asynchronously.
                before(function(){
                    callback();
                });
            } else {
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
            } else {
                callback();
            }
        }

        //run the test
        function runTest(callback){
            if(bWindowGlobals){
                if(self.callback.length){
                    //Pass done callback as 1st param if configured to use window globals.
                    self.callback.call(self.context, function(){
                        if(arguments.length && typeof(
                                arguments[0] === 'function')){
                            arguments[0].call(self.context);
                        }
                        self.runAssertions();
                        callback();
                    });
                } else {
                    self.callback.call(self.context);
                    self.runAssertions();
                    callback();
                }
            } else {
                if(self.callback.length === 1){
                    //Pass done callback as 1st param if configured to use window globals.
                    self.callback.call(self.context, function(){
                        if(arguments.length && typeof(arguments[0] === 'function')){
                            arguments[0].call(self.context);
                        }
                        self.runAssertions();
                        callback();
                    });
                } else {
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
            } else {
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
            } else {
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
                            } else {
                                test.completed = true;
                                d = Date .now() - start;
                                test .duration = d > 0 && d || 1;
                                if(test .totFailed){
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
        for(i = 0, len = this.assertions.length; i < len; i++){
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

    module.exports = Test;
}());
