(function(){
    'use strict';
    var argsToArray = require('./helpers.js').argsToArray,
        a_equals_b = require('./expectations/assertions.js').a_equals_b;

    function spyOn(argObject, argProperty){
        var targetFn,
            snoopster,
            calls = [];
        if(arguments.length){
            if(typeof(argObject) !== 'function' && typeof(argObject) !== 'object'){
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
            return this.args.length ? this.args.length : 0;
        };
        Args.prototype.hasArg = function(i){
            return i >= 0 && this.getLength() > i ? true : false;
        };
        Args.prototype.getArg = function(i){
            return this.hasArg(i) ? this.args[i] : null;
        };
        Args.prototype.hasArgProperty = function(i, propertyName){
            return this.hasArg(i) && propertyName in this.args[i] ? true : false;
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
            typeof(arguments[0]) === 'function' ? argObject : argObject[argProperty];
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
                try {
                    returned = fn.apply(snoopster._callWithContext || this, aArgs);
                } catch (er){
                    error = er;
                }
            } else if(snoopster._throws){
                try {
                    throw new ThrowsException(snoopster._throwsMessage, snoopster._throwsName);
                } catch (er){
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
        snoopster.and.reset = function(){
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
                    return (a_equals_b(a, args));
                });
            },
            wasCalledWithContext: function(obj){
                return calls.some(function(call){
                    var context = call.context;
                    return (a_equals_b(obj, context));
                });
            },
            returned: function(value){
                return calls.some(function(call){
                    var returned = call.getReturned();
                    return (a_equals_b(value, returned));
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
        snoopster.and.expect = {
            it: {}
        };
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
            var notations = require('./expectations/notations.js');

            // if(!snoopster._hasExpectations){
            //     throwException('"validate" expects a spy with predefined expectation and found none');
            // }
            //Expect the mock to have expectations
            notations.noteExpectation(snoopster);
            notations.noteMockHasExpectations();
            if(snoopster._expectations.toBeCalled){
                notations.noteExpectation(snoopster);
                notations.noteToHaveBeenCalled();
            }
            if(snoopster._expectations.toBeCalledWith){
                notations.noteExpectation(snoopster);
                notations.noteToHaveBeenCalledWith.apply(null,
                    argsToArray(snoopster._expectations.toBeCalledWith));
            }
            if(snoopster._expectations.toBeCalledWithContext){
                notations.noteExpectation(snoopster);
                notations.noteToHaveBeenCalledWithContext(
                    snoopster._expectations.toBeCalledWithContext);
            }
            if(snoopster._expectations.toReturn){
                notations.noteExpectation(snoopster);
                notations.noteToHaveReturned(snoopster._expectations.toReturn);
            }
            if(snoopster._expectations.toThrow){
                notations.noteExpectation(snoopster);
                notations.noteToHaveThrown();
            }
            if(snoopster._expectations.toThrowWithName){
                notations.noteExpectation(snoopster);
                notations.noteToHaveThrownWithName(snoopster._expectations.toThrowWithName);
            }
            if(snoopster._expectations.toThrowWithMessage){
                notations.noteExpectation(snoopster);
                notations.noteToHaveThrownWithMessage(snoopster._expectations.toThrowWithMessage);
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
    spyOn.x = function(argObject, argPropertyNames){
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
            spyOn(argObject, property);
        });
    };

    module.exports = spyOn;
}());
