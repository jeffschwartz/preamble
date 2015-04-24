/* jslint eqeq: true */
/* jshint strict: false */
/* global configure, describe, beforeEach, afterEach, it, spy, expect, -getUiTestContainerElement, -getUiTestContainerElementId */

/**
 * inline configuration
 * NOTE: inline configuration cannot be use to set "windowGlobals"!
 */
configure({
    name: 'Sample BDD Test Suite',
    hidePassedTests: true,
    testTimeOutInterval: 500
});

describe('"describe" describes a "suite" which can contains one or more "specs"', function(){
    it('and "it" specifies a spec which can contain one or more "assertions"', function(){
        expect(1).toEqual(1);
    });
});

describe('Assertions are composed using "expect" to set the actual value and a matcher', function(){
    it('"expect" sets the "actual" value & the matcher applies a condition against that', function(){
        expect(1).toEqual(1);
    });
});

describe('Preamble comes with numerous matchers', function(){
    it('the "toBeTrue" matcher uses a strict boolean comparison to assert that the actual value is boolen true', function(){
        expect(true).toBeTrue();
    });
    it('the "toBeFalse" matcher uses a strict boolean comparison to assert that the actual value is boolen false', function(){
        expect(false).toBeFalse();
    });
    it('the "toBeTruthy" matcher uses a truthy comparison to assert that the actual value is truthy', function(){
        expect({}).toBeTruthy();
    });
    it('the "toNotBeTruthy" matcher uses a truthy comparison to assert that the actual value is not truthy', function(){
        expect('').toNotBeTruthy();
    });
    it('the "toEqual" matcher sets the expected value and uses a deep recursive comparison to assert that the actual value and the expected value are equal (===)' , function(){
        var anObj1 = {iAm: 'some object to compare to'},
            anObj2 = {iAm: 'some object to compare to'};
        expect(anObj1).toEqual(anObj2);
    });
    it('the "toNotEqual" matcher sets the expected value and uses a deep recursive comparison to assert that the actual value and the expected value are not equal (!==)', function(){
        var anObj1 = {iAm: 'anObj1'},
            anObj2 = {iAm: 'anObj2'};
        expect(anObj1).toNotEqual(anObj2);
    });
});

describe('specs can be nested within specs', function(){
    beforeEach(function(){
        this.value = 10;
    });
    afterEach(function(){
        this.isCrazy = true;
    });
    describe('Nested spec 1', function(){
        it('nested spec 1: test 1', function(){
            expect(this.value).toEqual(10);
        });
        it('isCrazy is true', function(){
            expect(typeof(this.isCrazy) === 'undefined').toBeTrue();
        });
    });
    describe('Nested spec 2', function(){
        beforeEach(function(){
            this.foo = 'bar';
        });
        afterEach(function(){
            this.xx = 'xx';
        });
        it('nested spec 2: test 1', function(){
            expect(this.value).toEqual(10);
            expect(this.foo).toEqual('bar');
        });
        it('nested spec 2: test 2', function(){
            expect(this.value).toEqual(10);
            expect(this.foo).toEqual('bar');
            expect(typeof(this.xx) === 'undefined').toBeTrue();
        });
        describe('Nested spec 3', function(){
            beforeEach(function(){
                this.flim = 'flam';
            });
            it('nested spec 3: test 1', function(){
                expect(this.value).toEqual(10);
                expect(this.foo).toEqual('bar');
                expect(this.flim).toEqual('flam');
            });
        });
    });
});

describe('Evaluating boolean assertions', function(){
    it('bollean true', function(){
        expect(true).toBeTrue();
    });
    it('boolean false', function(){
        expect(false).toBeFalse();
    });
});

describe('Evaluating truthy assertions', function(){
    it('undefined', function(){
        var undef;
        expect(undef).toNotBeTruthy();
    });
    it('objects', function(){
        var def = {};
        expect(def).toBeTruthy();
    });
    it('numeric values other than 0', function(){
        var one = 1;
        expect(one).toBeTruthy();
    });
    it('numeric vaules that are 0', function(){
        var zero = 0;
        expect(zero).toNotBeTruthy();
    });
    it('non empty strings', function(){
        expect('not empty string').toBeTruthy();
    });
    it('empty strings', function(){
        expect('').toNotBeTruthy();
    });
});

describe('Evaluating strict, deep recursive comparison assertions', function(){
    var char = 'b';
    var a = {a: 'a', b: 'b'};
    var b = {a: 'a', b: b};
    var c = {a: 'a', b: 'b'};
    it('2 objects with exactly the same properties and property values', function(){
        expect(a).toEqual(c);
    });
    it('2 objects with different properties or property values', function(){
        expect(a).toNotEqual(b);
    });
    it('2 value types whose values are the same', function(){
        expect(char).toEqual('b');
    });
    it('2 value types whose values are  not the same', function(){
        expect(char).toNotEqual('a');
    });
});

describe('Running synchronous tests with beforeEach', function(){
    var count = 0;
    beforeEach(function(){
        count = 100;
    });
    it('beforeEach is called', function(){
        expect(count).toEqual(100);
    });
});

describe('Passing a value from beforeEach to tests', function(){
    beforeEach(function(){
        this.value = 10;
    });
    it('the tests', function(){
        expect(this.value).toEqual(10);
    });
});

describe('Running synchronous tests with afterEachTest', function(){
    var count = 0;
    afterEach(function(){
        count = 100;
    });
    it('the first test', function(){
        expect(count).toEqual(0);
    });
    it('but subsequent tests', function(){
        expect(count).toEqual(100);
    });
});

describe('Running asynchronous tests', function(){
    var count = 0;
    it('calling whenDone', function(done){
        setTimeout(function(){
            count = 100;
            done(function(){
                expect(count).toEqual(100);
            });
        }, 1);
    });
});

describe('Running asynchronous tests with beforeEachAsync', function(){
    var count = 0;
    beforeEach(function(done){
        setTimeout(function(){
            count = 10;
            done();
        }, 1);
    });
    it('beforeEachAsync is called', function(done){
        setTimeout(function(){
            count *= 10;
            done(function(){
                expect(count).toEqual(100);
            });
        }, 1);
    });
});

describe('Passing a value from beforeEachAsync to asynchronous tests', function(){
    beforeEach(function(done){
        var self = this;
        setTimeout(function(){
            self.value = 10;
            done();
        }, 1);
    });
    it('the asynchronous tests', function(done){
        setTimeout(function(){
            //some asynchronous process...
            done(function(){
                expect(this.value).toEqual(10);
            });
        }, 1);
    });
});

describe('Running asynchronous tests with afterEachAsync', function(){
    var count = 0;
    afterEach(function(done){
        setTimeout(function(){
            count = 1;
            done();
        }, 1);
    });
    it('the first asynchronous test', function(done){
        setTimeout(function(){
            count = 10;
            done(function(){
                expect(count).toEqual(10);
            });
        }, 1);
    });
    it('but subsequent asynchronous tests', function(done){
        setTimeout(function(){
            count *= 100;
            done(function(){
                expect(count).toEqual(100);
            });
        }, 1);
    });
});

describe('spying on a method', function(){
    beforeEach(function(){
        this.foo = {
            someFn: function(arg){
                return arg;
            }
        };
    });
    it('we can query if the method was called', function(){
        var foo = this.foo;
        spy(foo, 'someFn');
        foo.someFn();
        expect(foo.someFn).toHaveBeenCalled();
    });
    it('we can query if the method was not called', function(){
        var foo = this.foo;
        spy(foo, 'someFn');
        expect(foo.someFn).not.toHaveBeenCalled();
    });
    it('we can query how many times the method was called', function(){
        var foo = this.foo;
        spy(foo, 'someFn');
        foo.someFn();
        expect(foo.someFn.called()).toEqual(1);
    });
    it('we can query the method was called n times', function(){
        var foo = this.foo;
        spy(foo, 'someFn');
        foo.someFn();
        expect(foo.someFn.wasCalled.nTimes(1)).toBeTrue();
        expect(foo.someFn.wasCalled.nTimes(2)).toBeFalse();
    });
    it('we can query the context the method was called with', function(){
        var foo = this.foo,
            bar = {};
        spy(foo, 'someFn');
        foo.someFn();
        expect(foo.someFn.contextCalledWith()).toEqual(foo);
        expect(foo.someFn.contextCalledWith()).toNotEqual(bar);
    });
    it('we can query for the arguments that the method was called with', function(){
        var foo = this.foo,
            arg = 'Preamble rocks!';
        spy(foo, 'someFn');
        foo.someFn(arg);
        expect(foo.someFn.args.getArgument(0)).toEqual(arg);
        expect(foo.someFn.args.getArgument(0)).toNotEqual(arg + '!');
        expect(foo.someFn.args.getArgument(1)).toNotBeTruthy();
    });
    it('we can query for what the method returned', function(){
        var foo = this.foo,
            arg = 'Preamble rocks!';
        spy(foo, 'someFn').callActual();
        foo.someFn(arg);
        expect(foo.someFn).toHaveReturned(arg);
    });
    it('we can query for what the method did not returned', function(){
        var foo = this.foo,
            arg = 'Preamble rocks!';
        spy(foo, 'someFn').callActual();
        foo.someFn(arg);
        expect(foo.someFn).not.toHaveReturned(arg + '!');
    });
});

describe('spying on a method', function(){
    beforeEach(function(){
        this.error = 'something went terribly wrong!';
        this.foo = {
            someFn: function(arg){
                return arg;
            },
            someOtherFn: function(){
                throw new Error(this.error);
            }
        };
    });
    it('we can query if the method was called', function(){
        var foo = this.foo;
        spy(foo, 'someFn');
        foo.someFn();
        expect(foo.someFn).toHaveBeenCalled();
    });
    it('we can query if the method returned a specific value', function(){
        var foo = this.foo;
        spy(foo, 'someFn').callActual();
        foo.someFn(123);
        expect(foo.someFn).toHaveReturned(123);
    });
    it('we can query if the method threw an exception', function(){
        var foo = this.foo;
        spy(foo, 'someOtherFn').callActual();
        foo.someOtherFn(123);
        expect(foo.someOtherFn).toHaveThrown();
    });
    it('we can query if the method threw an exception with a specific value', function(){
        var foo = this.foo;
        spy(foo, 'someFn').throws(123);
        foo.someFn();
        expect(foo.someFn).toHaveThrownWithValue(123);
    });
    it('we can query if the method threw an exception with a specific message', function(){
        var foo = this.foo;
        spy(foo, 'someFn').throws('123');
        foo.someFn();
        expect(foo.someFn).toHaveThrownWithMessage('123');
    });
});

describe ('A stub is also a spy and when configured to return a value', function(){
    var foo = { someFn: function(){ return 25; } };
    it('returns that value', function(){
        spy(foo, 'someFn').returns(13);
        foo.someFn();
        expect(foo.someFn.returned()).toEqual(13);
    });
});

describe('A stub when configured to call the actual implementation', function(){
    var foo = { someFn: function(arg){ return arg; } };
    it('calls it', function(){
        spy(foo, 'someFn');
        foo.someFn(123);
        expect(foo.someFn.returned()).toNotEqual(123);
        foo.someFn.callActual();
        foo.someFn(123);
        expect(foo.someFn.returned()).toEqual(123);
    });
});

describe('A stub when configured to call a fake implementation', function(){
    var foo = { someFn: function(arg){ return arg; } };
    it('calls it', function(){
        spy(foo, 'someFn');
        foo.someFn(123);
        expect(foo.someFn.returned()).toNotEqual(123);
        foo.someFn.callActual();
        foo.someFn(123);
        expect(foo.someFn.returned()).toEqual(123);
        foo.someFn.callFake(function(){ return 'sorry'; });
        foo.someFn(123);
        expect(foo.someFn.returned()).toEqual('sorry');
    });
});

describe('A stub configured to call the actual implementation can be reset', function(){
    var foo = { someFn: function(arg){ return arg; } };
    it('and it will call the stub', function(){
        spy(foo, 'someFn').callActual();
        foo.someFn(123);
        expect(foo.someFn.returned()).toEqual(123);
        foo.someFn.callStub();
        foo.someFn(123);
        expect(foo.someFn.returned()).toEqual(void(0));
    });
});

describe('A stub when configured can throw an error', function(){
    var foo = { someFn: function(){} };
    it('with a message', function(){
        spy(foo, 'someFn').throws('Holy Batman!');
        foo.someFn();
        expect(foo.someFn.threw()).toBeTrue();
        expect(foo.someFn.threw.withMessage('Holy Batman!')).toBeTrue();
    });
    it('with a value', function(){
        spy(foo, 'someFn').throws(42);
        foo.someFn();
        expect(foo.someFn.threw()).toBeTrue();
        expect(foo.someFn.threw.withValue(42)).toBeTrue();
    });
    it('with a message and a value', function(){
        spy(foo, 'someFn').throws('Holy Batman!', 42);
        foo.someFn();
        expect(foo.someFn.threw()).toBeTrue();
        expect(foo.someFn.threw.withMessage('Holy Batman!')).toBeTrue();
        expect(foo.someFn.threw.withValue(42)).toBeTrue();
    });
});

describe('Using a "stub" to test Ajax', function(){
    //simulates a jQuery-like object
    var jQueryNot = {
        ajax: function(){}
    };
    function getToDos(count, callback){
        jQueryNot.ajax({
            url: '/api/v2/todo/count/' + count,
            success: function(toDos){
                callback(null, toDos);
            }
        });
    }
    it('without triggering a network call', function(){
        spy(jQueryNot, 'ajax');
        getToDos(10, function(){});
        expect(jQueryNot.ajax.wasCalled()).toBeTrue();
        expect(jQueryNot.ajax.args.getArgumentsLength()).toEqual(1);
        expect(jQueryNot.ajax.args.hasArgument(0)).toBeTrue();
        expect(typeof(jQueryNot.ajax.args.getArgument(0)) === 'object').toBeTrue();
        expect(jQueryNot.ajax.args.getArgumentProperty(0, 'url')).
            toEqual('/api/v2/todo/count/10');
    });
});

describe('spying on more than one method', function(){
    beforeEach(function(){
        this.foo = {
            someFn: function(arg){
                return arg;
            }
        };
        this.bar = {
            someFn: function(arg){
                return arg;
            }
        };
    });

    it('spies are isolated and there are no side effects', function(){
        var foo = this.foo,
            bar = this.bar;
        spy(foo, 'someFn');
        spy(bar, 'someFn');
        foo.someFn('Is Preamble great?');
        bar.someFn('Yes it is!');
        foo.someFn('You got that right!');
        expect(foo.someFn.wasCalled()).toBeTrue();
        expect(foo.someFn.wasCalled.nTimes(2)).toBeTrue();
        expect(foo.someFn.wasCalled.nTimes(1)).toBeFalse();
        expect(bar.someFn.wasCalled()).toBeTrue();
        expect(bar.someFn.wasCalled.nTimes(1)).toBeTrue();
        expect(bar.someFn.wasCalled.nTimes(2)).toBeFalse();
    });
});

describe('using spy\'s "calls" api with methods', function(){
    var i,
        foo = {
            someFn: function(arg){
                return arg;
            }
        },
        bar ={},
        n = 3,
        aCall;
    spy(foo, 'someFn').callActual();
    for(i = 0; i < n; i++){
        foo.someFn(i) ;
    }
    it('count() returns the right count', function(){
        expect(foo.someFn.calls.count()).toEqual(n);
    });
    it('all() returns an array with the right number of elements', function(){
        expect(foo.someFn.calls.all().length).toEqual(n);
    });
    it('forCall(n) returns the correct element', function(){
        for(i = 0; i < n; i++){
            aCall = foo.someFn.calls.forCall(i);
            expect(aCall.context).toEqual(foo);
            expect(aCall.context).toNotEqual(bar);
            expect(aCall.args[0]).toEqual(i);
            expect(aCall.args[0]).toNotEqual(n);
            expect(aCall.error).toNotBeTruthy();
            expect(aCall.returned).toEqual(i);
            expect(aCall.returned).toNotEqual(n);
        }
    });
});

/**
 *v2.3.0 support spying on standalone functions
 */
describe('spying on a function', function(){
    beforeEach(function(){
        this.someFn = function(arg){
                return arg;
        };
    });
    it('we can query if the function was called', function(){
        var someFn = this.someFn,
            spyFn = spy(someFn);
        spyFn();
        expect(spyFn.wasCalled()).toBeTrue();
    });
    it('we can query how many times the method was called', function(){
        var someFn = this.someFn,
            spyFn = spy(someFn);
        spyFn();
        expect(spyFn.called()).toEqual(1);
    });
    it('we can query the function was called n times', function(){
        var someFn = this.someFn,
            spyFn = spy(someFn);
        spyFn();
        expect(spyFn.wasCalled.nTimes(1)).toBeTrue();
        expect(spyFn.wasCalled.nTimes(2)).toBeFalse();
    });
    it('we can query the context the function was called with', function(){
        var someFn = this.someFn,
            bar = {},
            spyFn = spy(someFn, bar);
        spyFn();
        expect(spyFn.contextCalledWith()).toEqual(bar);
    });
    it('we can query for the arguments that the function was called with', function(){
        var someFn = this.someFn,
            spyFn = spy(someFn),
            arg = 'Preamble rocks!';
        spyFn(arg);
        expect(spyFn.args.getArgument(0)).toEqual(arg);
        expect(spyFn.args.getArgument(0)).toNotEqual(arg + '!');
        expect(spyFn.args.getArgument(1)).toNotBeTruthy();
    });
    it('we can query for what the function returned', function(){
        var someFn = this.someFn,
            spyFn = spy(someFn).callActual(),
            arg = 'Preamble rocks!';
        spyFn(arg);
        expect(spyFn.returned()).toEqual(arg);
        expect(spyFn.returned()).toNotEqual(arg + '1');
    });
});

describe('a spy function throws', function(){
    beforeEach(function(){
        this.someFn = function(){
            throw new Error('Holy Batman!');
        };
    });
    it('we can query the function if threw', function(){
        var spyFn = spy(this.someFn).callActual();
        spyFn();
        expect(spyFn.threw()).toBeTrue();
        expect(spyFn.threw.withMessage('Holy Batman!')).toBeTrue();
        expect(spyFn.threw.withMessage('Holy Batman!!')).toBeFalse();
    });
});

describe('spying on more than one function', function(){
    beforeEach(function(){
        this.fooFn = function(arg){
            return arg;
        };
        this.barFn = function(arg){
            return arg;
        };
    });

    it('spies are isolated and there are no side effects', function(){
        var fooFn = this.fooFn,
            barFn = this.barFn,
            spyFooFn = spy(fooFn),
            spyBarFn = spy(barFn);
        spyFooFn('Is Preamble great?');
        spyBarFn('Yes it is!');
        spyFooFn('You got that right!');
        expect(spyFooFn.wasCalled()).toBeTrue();
        expect(spyFooFn.wasCalled.nTimes(2)).toBeTrue();
        expect(spyFooFn.wasCalled.nTimes(1)).toBeFalse();
        expect(spyBarFn.wasCalled()).toBeTrue();
        expect(spyBarFn.wasCalled.nTimes(1)).toBeTrue();
        expect(spyBarFn.wasCalled.nTimes(2)).toBeFalse();
    });
});

describe('using spy\'s "calls" api with functions', function(){
    var i,
        foo = function(arg){
            return arg;
        },
        bar ={},
        n = 3,
        aCall,
        spyFooFn = spy(foo, bar).callActual();
    for(i = 0; i < n; i++){
        spyFooFn(i) ;
    }
    it('count() returns the right count', function(){
        expect(spyFooFn.calls.count()).toEqual(n);
    });
    it('all() returns an array with the right number of elements', function(){
        expect(spyFooFn.calls.all().length).toEqual(n);
    });
    it('forCall(n) returns the correct element', function(){
        for(i = 0; i < n; i++){
            aCall = spyFooFn.calls.forCall(i);
            expect(aCall.context).toEqual(bar);
            expect(aCall.args[0]).toEqual(i);
            expect(aCall.args[0]).toNotEqual(n);
            expect(aCall.error).toNotBeTruthy();
            expect(aCall.returned).toEqual(i);
            expect(aCall.returned).toNotEqual(n);
        }
    });
});
