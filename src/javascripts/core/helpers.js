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

    //Get URL query string param...thanks MDN.
    function loadPageVar(sVar){
        return decodeURI(window.location.search.replace(new RegExp(
            '^(?:.*[&\\?]' + encodeURI(sVar).replace(/[\.\+\*]/g, '\\$&') +
            '(?:\\=([^&]*))?)?.*$', 'i'), '$1'));
    }

    //Display caught errors to the browser.
    function errorHandler(){
        var html;
        //isProcessAborted = true;
        if(arguments.length === 3){
            //window.onerror
            html = '<p class="failed">' + arguments[0] + '</p><p>File: ' +
                arguments[1] + '</p><p>Line: ' + arguments[2] + '</p>';
        } else {
            //catch(e)
            html = '<p class="failed">An error occurred,  "' + arguments[0] +
                '" and all further processing has been terminated. Please check your browser console for additional details.</p>';
        }
        document.getElementById('preamble-status-container').innerHTML = html;
    }

    //Returns the ui test container element.
    function getUiTestContainerElement(){
        return document.getElementById(globals.config.uiTestContainerId);
    }

    //Returns the id of the ui test container element.
    function getUiTestContainerElementId(){
        return globals.config.uiTestContainerId;
    }

    //Returns the "line" in the stack trace that points to the failed assertion.
    function stackTrace(st){
        var reFileFromStackTrace = /file:\/\/\/\S+\.js:[0-9]+[:0-9]*/g,
        //Get all file references...
            matches = st.match(reFileFromStackTrace);

        //... and filter out all references to preamble.js.
        return matches.reduce(function(previousValue, currentValue){
            if(currentValue.search(/preamble.js/) === -1){
                return previousValue + '<p class="stacktrace">' + currentValue + '</p>';
            } else {
                return previousValue;
            }
        }, '');
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
    exports.merge = merge;
    exports.loadPageVar = loadPageVar;
    exports.errorHandler = errorHandler;
    exports.getUiTestContainerElement = getUiTestContainerElement;
    exports.getUiTestContainerElementId = getUiTestContainerElementId;
    exports.stackTrace = stackTrace;
    exports.pluralize = pluralize;
}());
