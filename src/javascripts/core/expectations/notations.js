(function(){
    'use strict';
    var throwException = require('../helpers.js').throwException,
        spy = require('../spy.js'),
        globals = require('../globals.js'),
        pushOntoAssertions = require('../helpers.js').pushOntoAssertions,
        completeTheAssertion = require('../helpers.js').completeTheAssertion,
        stackTraceFromError = require('../helpers.js').stackTraceFromError,
        argsToArray = require('../helpers.js').argsToArray,
        assertionRunners = require('./assertionrunners.js');

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
            pushOntoAssertions(null, null, actual, null, null);
            //return assert for chaining
            return globals.assert;
        },
        //only used by mock.validate and not part of the public api
        noteMockHasExpectations: function (){
            if(arguments.length){
                throwException('matcher "toHaveBeenCalled" expects no arguments, found ' +
                    arguments.length);
            }

            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertMockHasExpectations, null,
                stackTraceFromError(), a.value._hasExpectations);
        },
        noteToHaveBeenCalled: function(){
            if(arguments.length){
                throwException('matcher "toHaveBeenCalled" expects no arguments, found ' +
                    arguments.length);
            }

            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToHaveBeenCalled, null, stackTraceFromError(),
                a.value.calls.count() > 0);
        },
        noteToNotHaveBeenCalled: function (){
            if(arguments.length){
                throwException('matcher "toNotHaveBeenCalled" expects no arguments, found ' +
                    arguments.length);
            }

            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToNotHaveBeenCalled, null, stackTraceFromError(),
                a.value.calls.count() > 0);
        },
        noteToHaveBeenCalledWith: function(){
            if(!arguments.length){
                throwException('matcher "toHaveBeenCalledWith" expects 1 or more arguments, found none');
            }

            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToHaveBeenCalledWith, argsToArray(arguments), stackTraceFromError(),
                a.value.calls.wasCalledWith.apply(null, arguments));
        },
        noteToNotHaveBeenCalledWith: function (){
            if(!arguments.length){
                throwException('matcher "toNotHaveBeenCalledWith" expects 1 or more arguments, found none');
            }

            var ti = globals.testsIterator,
                a = ti.get()
                .assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToNotHaveBeenCalledWith, argsToArray(arguments), stackTraceFromError(),
                a.value.calls.wasCalledWith.apply(null, arguments));
        },
        noteToHaveBeenCalledWithContext: function(context){
            if(arguments.length !== 1){
                throwException( 'matcher "toHaveBeenCalledWithContext" expects 1 arguments, found ' +
                    arguments.length);
            }

            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToHaveBeenCalledWithContext, context, stackTraceFromError(),
                a.value.calls.wasCalledWithContext(context));
        },
        noteToNotHaveBeenCalledWithContext: function(context){
            if(arguments.length !== 1){
                throwException('matcher "toHaveBeenCalledWithContext" expects 1 arguments, found ' +
                    arguments.length);
            }

            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToNotHaveBeenCalledWithContext, context, stackTraceFromError(),
                a.value.calls.wasCalledWithContext(context));
        },
        noteToHaveReturned: function(value){
            if(arguments.length !== 1){
                throwException('matcher "toHaveReturned" expects 1 arguments, found none');
            }
            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToHaveReturned, value, stackTraceFromError(),
                a.value.calls.returned(value));
        },
        noteToNotHaveReturned: function(value){
            if(arguments.length !== 1){
                throwException('matcher "toHaveReturned" expects 1 arguments, found none');
            }
            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get() .assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToNotHaveReturned, value, stackTraceFromError(),
                a.value.calls.returned(value));
        },
        noteToHaveThrown: function(){
            if(arguments.length){
                throwException('matcher "toHaveThrown" expects no arguments, found ' +
                    arguments.length);
            }
            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToHaveThrown, true, stackTraceFromError(),
                a.value.calls.threw());
        },
        noteToNotHaveThrown: function(){
            if(arguments.length){
                throwException('matcher "toNotHaveThrown" expects no arguments, found ' +
                    arguments.length);
            }
            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToNotHaveThrown, true, stackTraceFromError(),
                a.value.calls.threw());
        },
        noteToHaveThrownWithName: function(value){
            if(arguments.length !== 1){
                throwException('matcher "toHaveThrownWithName" requires 1 argument, found ' +
                    arguments.length);
            }
            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToHaveThrownWithName, value, stackTraceFromError(),
                a.value.calls.threwWithName(value));
        },
        noteToNotHaveThrownWithName: function (value){
            if(arguments.length !== 1){
                throwException('matcher "toNotHaveThrownWithName" requires 1 argument, found ' +
                    arguments.length);
            }
            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToNotHaveThrownWithName, value, stackTraceFromError(),
                a.value.calls.threwWithName(value));
        },
        noteToHaveThrownWithMessage: function(value){
            if(arguments.length !== 1){
                throwException('matcher "toHaveThrownWithMessage" requires 1 argument, found ' +
                    arguments.length);
            }
            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToHaveThrownWithMessage, value, stackTraceFromError(),
                a.value.calls.threwWithMessage(value)
            );
        },
        noteToNotHaveThrownWithMessage: function (value){
            if(arguments.length !== 1){
                throwException('matcher "toNotHaveThrownWithMessage" requires 1 argument, found ' +
                    arguments.length);
            }
            var ti = globals.testsIterator,
                a = ti.get().assertions[ti.get().assertions.length - 1];
            completeTheAssertion(assertionRunners.assertToNotHaveThrownWithMessage, value, stackTraceFromError(),
                a.value.calls.threwWithMessage(value)
            );
        },
        noteToEqualAssertion: function(value){
            if(arguments.length !== 1){
                throwException('matcher "toEqual" requires 1 argument, found ' +
                    arguments.length);
            }
            completeTheAssertion(assertionRunners.assertEqual, value, stackTraceFromError());
        },
        noteToNotEqualAssertion: function(value){
            if(arguments.length !== 1){
                throwException('matcher "toNotEqual" requires 1 argument, found ' +
                    arguments.length);
            }
            completeTheAssertion(assertionRunners.assertNotEqual, value, stackTraceFromError());
        },
        noteToBeTrueAssertion: function (){
            if(arguments.length){
                throwException('matcher "toBeTrue;" expects no arguments, found ' +
                    arguments.length);
            }
            completeTheAssertion(assertionRunners.assertIsTrue, true, stackTraceFromError());
        },
        noteToBeFalseAssertion: function(){
            if(arguments.length){
                throwException('matcher "toBeFalse;" expects no arguments, found ' +
                    arguments.length);
            }
            completeTheAssertion(assertionRunners.assertIsFalse, true, stackTraceFromError());
        },
        noteToBeTruthyAssertion: function(){
            if(arguments.length){
                throwException('matcher "toBeTruthy" expects no arguments, found ' +
                    arguments.length);
            }
            completeTheAssertion(assertionRunners.assertIsTruthy, true, stackTraceFromError());
        },
        noteToNotBeTruthyAssertion: function(){
            if(arguments.length){
                throwException('matcher "toNotBeTruthy" expects no arguments, found ' +
                    arguments.length);
            }
            completeTheAssertion(assertionRunners.assertIsNotTruthy, true, stackTraceFromError());
        },
    };
}());
