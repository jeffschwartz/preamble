(function(){
    'use strict';
    var globals = require('./globals.js');

    function argsToArray(argArguments){
        return [].slice.call(argArguments, 0);
    }

    function throwException(errMessage){
        throw new Error(errMessage);
    }

    function compare(a, b){
        return compareObjects(a, b) && compareObjects(b, a);
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
            } else {
                return false;
            }
        }
        return true;
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

    function pushOntoAssertions(assertion, assertionLabel, value, expectation, stackTrace){
        globals.testsIterator.get().assertions.push({
            assertion: assertion,
            assertionLabel: assertionLabel,
            value: value,
            expectation: expectation,
            stackTrace: stackTrace
        });
    }

    function completeTheAssertion(assertion, value, stackTrace, actual){
        var ti = globals.testsIterator,
            a = ti.get().assertions[ti.get().assertions.length - 1];
        a.assertion = assertion;
        a.expectation = value;
        a.stackTrace = stackTrace;
        a.value = typeof(actual) === 'undefined' ? a.value : actual;
    }

    function setStackTraceProperty(){
        try {
            throw new Error('woops');
        } catch (error){
            require('./globals.js').stackTraceProperty = error.stack ? 'stack' : error.stacktrace ?
                'stacktrace' : undefined;
        }
    }

    function getStackTraceProperty(){
        return require('./globals.js').stackTraceProperty;
    }

    function stackTraceFromError(){
        var stack = null;
        if(getStackTraceProperty()){
            try {
                throw new Error();
            } catch (error){
                stack = error[getStackTraceProperty()];
            }
        }
        return stack;
    }

    exports.argsToArray = argsToArray;
    exports.throwException = throwException;
    exports.compare = compare;
    exports.compareArrays = compareArrays;
    exports.compareObjects = compareObjects;
    exports.pushOntoAssertions = pushOntoAssertions;
    exports.completeTheAssertion = completeTheAssertion;
    exports.setStackTraceProperty = setStackTraceProperty;
    exports.stackTraceFromError = stackTraceFromError;
    exports.getStackTraceProperty = getStackTraceProperty;
}());
