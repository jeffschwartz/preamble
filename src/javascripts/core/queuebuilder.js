(function(){
    /**
     * Process for building the queue.
     * @param {array} - queue, filled with Groups and Tests.
     * @param {function} - trhowException, a function called to throw an exception.
     */
    'use strict';
    var
        // queue = require('./globals.js').queue,
        // config = require('./globals.js').config,
        helpers = require('./helpers.js'),
        Group = require('./group.js'),
        Test = require('./test.js'),
        groupStack = [],
        uniqueId;

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
        var runtimeFilter = require('./globals.js').runtimeFilter,
            s,
            path = '';
        if(!runtimeFilter.group){
            return true;
        } else {
            if(obj instanceof(Group)){
                path = obj.pathFromParentGroupLabels();
                s = path.substr(0, runtimeFilter.group.length);
                return s === runtimeFilter.group;
            } else {
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
    exports.group = function(label, callback){
        var queue = require('./globals.js').queue,
            grp,
            id,
            path;
        if(arguments.length !== 2){
            helpers.throwException('requires 2 arguments, found ' + arguments.length);
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
    exports.beforeEachTest = function(callback){
        var parentGroup = groupStack[groupStack.length - 1];
        parentGroup.beforeEachTest = callback;
    };

    exports.afterEachTest = function(callback){
        var parentGroup = groupStack[groupStack.length - 1];
        parentGroup.afterEachTest = callback;
    };

    /**
     * Registers a test.
     * @param {string} label, describes the test/spec.
     * @param {function} callback, called to run the test.
     * @param {integer} timeoutInterval, optional, the amount of time
     * the test is allowed to run before timing out the test.
     */
    exports.test = function(label, callback, timeoutInterval){
        // var queue = require('./globals.js').queue,
        //     config = require('./globals.js').config,
        var globals = require('./globals.js'),
            tst,
            parentGroup,
            id,
            path,
            tl,
            cb,
            stackTrace;
        if(arguments.length < 2){
            helpers.throwException('requires at least 2 arguments, found ' + arguments.length);
        }
        tl = arguments.length === 3 && timeoutInterval || globals.config.timeoutInterval;
        cb = arguments.length === 3 && callback || arguments[1];
        parentGroup = groupStack[groupStack.length - 1];
        id = uniqueId();
        path = groupStack.getPath() + '/' + id;
        stackTrace = helpers.stackTraceFromError();
        tst = new Test(groupStack, id, path, label, stackTrace, tl, cb, globals.config.windowGlobals);
        tst.bypass = !filter(tst);
        globals.queue.push(tst);
    };
}());
