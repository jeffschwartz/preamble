(function(){ /**
     * Process for building the queue.
     * @param {array} - queue, filled with Suites and Specs.
     * @param {function} - trhowException, a function called to throw an exception.
     */
    'use strict';
    var helpers = require('./helpers.js'),
        Suite = require('./suite.js'),
        Spec = require('./spec.js'),
        suiteStack = [],
        uniqueId;

    uniqueId = (function(){
        var i = 0;
        return function(){
            return i += 1;
        };
    }());

    suiteStack.getPath = function(){
        var result = this.reduce(function(prevValue, suite){
            return prevValue + '/' + suite.id;
        }, '');
        return result;
    };

    /**
     * Returns true if there is no run time filter
     * or if obj matches the run time filter.
     * Returns false otherwise.
     * @param {object} obj, either a Spec or a Suite.
     */
    function filter(obj){
        var runtimeFilter = require('./globals.js').runtimeFilter,
            s,
            path = '';
        if(!runtimeFilter.suite){
            return true;
        } else {
            if(obj instanceof(Suite)){
                path = obj.pathFromAncestorSuiteLabels();
                s = path.substr(0, runtimeFilter.suite.length);
                return s === runtimeFilter.suite;
            } else {
                path = obj.parentSuite.pathFromAncestorSuiteLabels();
                s = path.substr(0, runtimeFilter.suite.length);
                return s === runtimeFilter.suite && runtimeFilter.spec === '' ||
                    s === runtimeFilter.suite && runtimeFilter.spec === obj.label;
            }
        }
    }

    /**
     * Registers a suite.
     * @param {string} label, describes the suite.
     * @param {function} callback,  called to run befores, spec and afters.
     */
    exports.suite = function(label, callback){
        var queue = require('./globals.js').queue,
            suite,
            id,
            path;
        if(arguments.length !== 2){
            helpers.throwException('requires 2 arguments, found ' + arguments.length);
        }
        id = uniqueId();
        path = suiteStack.getPath() + '/' + id;
        suite = new Suite(suiteStack, id, path, label, callback);
        suite.bypass = !filter(suite);
        queue.push(suite);
        suiteStack.push(suite);
        suite.callback();
        suiteStack.pop();
    };

    /**
     * Registers a before each spec process.
     * @param {function} callback,  called before running a spec.
     */
    exports.beforeEachSpec = function(callback){
        var parentSuite = suiteStack[suiteStack.length - 1];
        parentSuite.before = callback;
    };

    exports.afterEachSpec = function(callback){
        var parentSuite = suiteStack[suiteStack.length - 1];
        parentSuite.after = callback;
    };

    /**
     * Registers a spec.
     * @param {string} label, describes the spec.
     * @param {function} callback, called to run the spec.
     * @param {integer} timeoutInterval, optional, the amount of time
     * the spec is allowed to run before timing out.
     */
    exports.spec = function(label, callback, timeoutInterval){
        var globals = require('./globals.js'),
            spec,
            parentSuite,
            id,
            path,
            toi,
            cb,
            stackTrace;
        if(arguments.length < 2){
            helpers.throwException('requires at least 2 arguments, found ' + arguments.length);
        }
        toi = arguments.length === 3 && timeoutInterval || globals.config.timeoutInterval;
        cb = arguments.length === 3 && callback || arguments[1];
        parentSuite = suiteStack[suiteStack.length - 1];
        id = uniqueId();
        path = suiteStack.getPath() + '/' + id;
        stackTrace = helpers.stackTraceFromError();
        spec = new Spec(suiteStack, id, path, label, stackTrace, toi, cb, globals.config.windowGlobals);
        spec.bypass = !filter(spec);
        globals.queue.push(spec);
    };
}());
