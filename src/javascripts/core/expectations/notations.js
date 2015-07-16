(function(){
    'use strict';
    var throwException = require('../helpers.js').throwException,
        spy = require('../spy.js'),
        globals = require('../globals.js'),
        pushOntoExpectations = require('../helpers.js').pushOntoExpectations,
        completeTheExpectation = require('../helpers.js').completeTheExpectation,
        stackTraceFromError = require('../helpers.js').stackTraceFromError,
        argsToArray = require('../helpers.js').argsToArray,
        assertionRunners = require('./assertionrunners.js');

    function getActualValue(){
        var spec = globals.testsIterator.get();
        return spec.expectations[spec.expectations.length - 1].value;
    }

    module.exports = {
        noteExpectation: function (actual){
            if(arguments.length !== 1){
                throwException('"expect" requires 1 argument, found ' + arguments.length);
            }
            if(typeof(actual) === 'function' && !('_snoopsterMaker' in actual)){
                actual = spy(actual).and.callActual();
                actual();
            }
            //push partial assertion (only the value) info onto the assertion table
            pushOntoExpectations(null, null, actual, null, null);
            //return the expectationApi for chaining
            return globals.expectationApi;
        },
        //only used by mock.validate and not part of the public api
        noteMockHasExpectations: function (){
            if(arguments.length){
                throwException('matcher "toHaveBeenCalled" expects no arguments, found ' +
                    arguments.length);
            }

            completeTheExpectation(assertionRunners.assertMockHasExpectations, null,
                stackTraceFromError(), getActualValue()._hasExpectations);
        },
        noteToHaveBeenCalled: function(){
            if(arguments.length){
                throwException('matcher "toHaveBeenCalled" expects no arguments, found ' +
                    arguments.length);
            }

            completeTheExpectation(assertionRunners.assertToHaveBeenCalled, null, stackTraceFromError(),
                getActualValue().calls.count() > 0);
        },
        noteToNotHaveBeenCalled: function (){
            if(arguments.length){
                throwException('matcher "toNotHaveBeenCalled" expects no arguments, found ' +
                    arguments.length);
            }

            completeTheExpectation(assertionRunners.assertToNotHaveBeenCalled, null, stackTraceFromError(),
                getActualValue().calls.count() > 0);
        },
        noteToHaveBeenCalledWith: function(){
            if(!arguments.length){
                throwException('matcher "toHaveBeenCalledWith" expects 1 or more arguments, found none');
            }

            completeTheExpectation(assertionRunners.assertToHaveBeenCalledWith, argsToArray(arguments),
                stackTraceFromError(), getActualValue().calls.wasCalledWith.apply(null, arguments));
        },
        noteToNotHaveBeenCalledWith: function (){
            if(!arguments.length){
                throwException('matcher "toNotHaveBeenCalledWith" expects 1 or more arguments, found none');
            }

            completeTheExpectation(assertionRunners.assertToNotHaveBeenCalledWith, argsToArray(arguments),
                stackTraceFromError(), getActualValue().calls.wasCalledWith.apply(null, arguments));
        },
        noteToHaveBeenCalledWithContext: function(context){
            if(arguments.length !== 1){
                throwException( 'matcher "toHaveBeenCalledWithContext" expects 1 arguments, found ' +
                    arguments.length);
            }

            completeTheExpectation(assertionRunners.assertToHaveBeenCalledWithContext, context,
                stackTraceFromError(), getActualValue().calls.wasCalledWithContext(context));
        },
        noteToNotHaveBeenCalledWithContext: function(context){
            if(arguments.length !== 1){
                throwException('matcher "toHaveBeenCalledWithContext" expects 1 arguments, found ' +
                    arguments.length);
            }

            completeTheExpectation(assertionRunners.assertToNotHaveBeenCalledWithContext, context,
                stackTraceFromError(), getActualValue().calls.wasCalledWithContext(context));
        },
        noteToHaveReturned: function(value){
            if(arguments.length !== 1){
                throwException('matcher "toHaveReturned" expects 1 arguments, found none');
            }
            completeTheExpectation(assertionRunners.assertToHaveReturned, value, stackTraceFromError(),
                getActualValue().calls.returned(value));
        },
        noteToNotHaveReturned: function(value){
            if(arguments.length !== 1){
                throwException('matcher "toHaveReturned" expects 1 arguments, found none');
            }
            completeTheExpectation(assertionRunners.assertToNotHaveReturned, value, stackTraceFromError(),
                getActualValue().calls.returned(value));
        },
        noteToHaveThrown: function(){
            if(arguments.length){
                throwException('matcher "toHaveThrown" expects no arguments, found ' + arguments.length);
            }
            completeTheExpectation(assertionRunners.assertToHaveThrown, true, stackTraceFromError(),
                getActualValue().calls.threw());
        },
        noteToNotHaveThrown: function(){
            if(arguments.length){
                throwException('matcher "toNotHaveThrown" expects no arguments, found ' +
                    arguments.length);
            }
            completeTheExpectation(assertionRunners.assertToNotHaveThrown, true, stackTraceFromError(),
                getActualValue().calls.threw());
        },
        noteToHaveThrownWithName: function(value){
            if(arguments.length !== 1){
                throwException('matcher "toHaveThrownWithName" requires 1 argument, found ' +
                    arguments.length);
            }
            completeTheExpectation(assertionRunners.assertToHaveThrownWithName, value, stackTraceFromError(),
                getActualValue().calls.threwWithName(value));
        },
        noteToNotHaveThrownWithName: function (value){
            if(arguments.length !== 1){
                throwException('matcher "toNotHaveThrownWithName" requires 1 argument, found ' +
                    arguments.length);
            }
            completeTheExpectation(assertionRunners.assertToNotHaveThrownWithName, value, stackTraceFromError(),
                getActualValue().calls.threwWithName(value));
        },
        noteToHaveThrownWithMessage: function(value){
            if(arguments.length !== 1){
                throwException('matcher "toHaveThrownWithMessage" requires 1 argument, found ' +
                    arguments.length);
            }
            completeTheExpectation(assertionRunners.assertToHaveThrownWithMessage, value, stackTraceFromError(),
                getActualValue().calls.threwWithMessage(value)
            );
        },
        noteToNotHaveThrownWithMessage: function (value){
            if(arguments.length !== 1){
                throwException('matcher "toNotHaveThrownWithMessage" requires 1 argument, found ' +
                    arguments.length);
            }
            completeTheExpectation(assertionRunners.assertToNotHaveThrownWithMessage, value, stackTraceFromError(),
                getActualValue().calls.threwWithMessage(value)
            );
        },
        noteToEqualAssertion: function(value){
            if(arguments.length !== 1){
                throwException('matcher "toEqual" requires 1 argument, found ' +
                    arguments.length);
            }
            completeTheExpectation(assertionRunners.assertEqual, value, stackTraceFromError());
        },
        noteToNotEqualAssertion: function(value){
            if(arguments.length !== 1){
                throwException('matcher "toNotEqual" requires 1 argument, found ' +
                    arguments.length);
            }
            completeTheExpectation(assertionRunners.assertNotEqual, value, stackTraceFromError());
        },
        noteToBeTrueAssertion: function (){
            if(arguments.length){
                throwException('matcher "toBeTrue;" expects no arguments, found ' +
                    arguments.length);
            }
            completeTheExpectation(assertionRunners.assertIsTrue, true, stackTraceFromError());
        },
        noteToBeFalseAssertion: function(){
            if(arguments.length){
                throwException('matcher "toBeFalse;" expects no arguments, found ' +
                    arguments.length);
            }
            completeTheExpectation(assertionRunners.assertIsFalse, true, stackTraceFromError());
        },
        noteToBeTruthyAssertion: function(){
            if(arguments.length){
                throwException('matcher "toBeTruthy" expects no arguments, found ' +
                    arguments.length);
            }
            completeTheExpectation(assertionRunners.assertIsTruthy, true, stackTraceFromError());
        },
        noteToNotBeTruthyAssertion: function(){
            if(arguments.length){
                throwException('matcher "toNotBeTruthy" expects no arguments, found ' +
                    arguments.length);
            }
            completeTheExpectation(assertionRunners.assertIsNotTruthy, true, stackTraceFromError());
        },
    };
}());
