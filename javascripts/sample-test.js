/*jslint eqeq: true*/
/*jshint strict: false*/
/*global configure, group, beforeEachTest, asyncBeforeEachTest, afterEachTest, asyncAfterEachTest, test, asyncTest, whenAsyncDone, -getUiTestContainerElement, -getUiTestContainerElementId, snoop, proxy, equal, notEqual, isTrue, isFalse, isTruthy, isNotTruthy*/

/* 
 * This script uses TDD semantics. If you prefer BDD-like 
 * semantics, then please see javascripts\sample2-test.js.
 */ 

configure({
    name: 'Sample Test Suite (TDD)',
    hidePassedTests: true
});

group('When runnig a test', function(){
    test('and it passes', function(){
        var hw = 'Hello World!';
        isTrue(hw === 'Hello World!', 'it looks like this');
    });
    test('and it fails', function(){
        isTrue(false, 'it looks like this');
    });
});

group('When evaluating boolean assertions', function(){
    test('bollean true', function(){
        isTrue(true, 'is true');
    });
    test('boolean false', function(){
        isFalse(false, 'is false');
    });
});

group('When evaluating truthy assertions', function(){
    test('undefined', function(){
        var undef;
        isNotTruthy(undef, 'is not truthy');
    });
    test('objects', function(){
        var def = {};
        isTruthy(def, 'are truthy');
    });
    test('numeric values other than 0', function(){
        var one = 1;
        isTruthy(one, 'are truthy');
    });
    test('numeric vaules that are 0', function(){
        var zero = 0;
        isNotTruthy(zero, 'are not truthy');
    });
    test('non empty strings', function(){
        isTruthy('not empty string', 'are truthy');
    });
    test('empty strings', function(){
        isNotTruthy('', 'are not truthy');
    });
});

group('When evaluating strict, deep recursive comparison assertions', function(){
    var char = 'b';
    var a = {a: 'a', b: 'b'};
    var b = {a: 'a', b: b};
    var c = {a: 'a', b: 'b'};
    test('2 objects with exactly the same properties and property values', function(){
        equal(a, c, 'are equal');
    });
    test('2 objects with different properties or property values', function(){
        notEqual(a, b, 'are not equal');
    });
    test('2 value types whose values are the same', function(){
        equal(char, 'b', 'are equal');
    });
    test('2 value types whose values are  not the same', function(){
        notEqual(char, 'a', 'are not equal');
    });
});

group('When running a synchronous test with beforeEachTest', function(){
    var count = 0;
    beforeEachTest(function(){
        count = 100;
    });
    test('beforeEachTest is called', function(){
        equal(count, 100, 'before test is called');
    });
});

group('When passing a value from beforeEachTest to test', function(){
    beforeEachTest(function(valObj){
        valObj.value = 10;
    });
    test('the test', function(valObj){
        equal(valObj.value, 10, 'can access the value');
    });
});

group('When running a synchronous test with afterEachTest', function(){
    var count = 0;
    afterEachTest(function(){
        count = 100;
    });
    test('the first test', function(){
        equal(count, 0, 'is not afftected');
    });
    test('but subsequent tests', function(){
        equal(count, 100, 'are affected');
    });
});

group('When running an asynchronous test', function(){
    var count = 0;
    asyncTest('calling whenAsyncDone', 1, function(){
        setTimeout(function(){
            count = 100;
        }, 1);
        whenAsyncDone(function(){
            equal(count, 100, 'causes the whenAsyncDone callback function to be called when the asynchronous test has ended');
        });
    });
});

group('When running an asynchronous tests with asyncBeforeEachTest', function(){
    var count = 0;
    asyncBeforeEachTest(1, function(){
        setTimeout(function(){
            count = 10;
        }, 1);
    });
    asyncTest('asyncBeforeEachTest is called', 1, function(){
        setTimeout(function(){
            count *= 10;
        }, 1);
        whenAsyncDone(function(){
            equal(count, 100, 'before asyncTest is called ');
        });
    });
});

group('When passing a value from asyncBeforeEachTest to asyncTest', function(){
    asyncBeforeEachTest(1, function(valObj){
        setTimeout(function(){
            valObj.value = 10;
        }, 1);
    });
    asyncTest('the asyncTest', 1, function(valObj){
        setTimeout(function(){
            //some asynchronous process...
        }, 1);
        whenAsyncDone(function(){
            equal(valObj.value, 10, 'can access the value');
        });
    });
});

group('When running an asynchronous tests with asyncAfterEachTest', function(){
    var count = 0;
    asyncAfterEachTest(1, function(){
        setTimeout(function(){
            count = 1;
        }, 1);
    });
    asyncTest('the first asyncTest', 1, function(){
        setTimeout(function(){
            count = 10;
        }, 1);
        whenAsyncDone(function(){
            isTrue(count === 10, 'is not affected');
        });
    });
    asyncTest('but subsequent asyncTests', 1, function(){
        setTimeout(function(){
            count *= 100;
        }, 1);
        whenAsyncDone(function(){
            isTrue(count === 100, 'are affected');
        });
    });
});

group('When proxy wraps a function and that function is called', function(){
    beforeEachTest(function(val){
        var fn = proxy(function(){
            return 'JavaScript is amazing!';
        });
        fn('Tell me something about JavaScript');
        val.fn = fn;
    });
    test('then calling wasCalled(number) on that function', function(val){
        isTrue(val.fn.wasCalled(1), 'returns true if it was called that number times');
        isFalse(val.fn.wasCalled(2), 'and returns false if it was not called that number of times');
    });
    test('then calling getCalledCount() on that function', function(val){
        equal(val.fn.getCalledCount(), 1, 'returns the number of times it was called');
    });
    test('then calling getData(n) on that function', function(val){
        var info = val.fn.getData(0);
        notEqual(info, undefined, 'returns an object');
    });
    test('and the object that getData(n) returns exposes and api', function(val){
        var info = val.fn.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript', 'and calling argsPassed[n] returns the arguments that were passed to the function');
        equal(info.returned, 'JavaScript is amazing!', 'and calling returned() returns what the function returned');
        isTrue(info.context === undefined, 'and calling context() returns the context the function was called with');
    });
});

group('When proxy wraps a method and that function is called', function(){
    beforeEachTest(function(val){
        var someObject = {
            someMethod: function(){
                return 'JavaScript is amazing!';
            }
        };
        proxy(someObject, 'someMethod');
        someObject.someMethod('Tell me something about JavaScript');
        val.someObject = someObject;
    });
    test('then calling wasCalled(number) on that method', function(val){
        isTrue(val.someObject.someMethod.wasCalled(1), 'returns true if it was called that number times');
        isFalse(val.someObject.someMethod.wasCalled(2), 'and returns false if it was not called that number of times');
    });
    test('then calling getCalledCount() on that method', function(val){
        equal(val.someObject.someMethod.getCalledCount(), 1, 'returns the number of times it was called');
    });
    test('then calling getData(n) on that method', function(val){
        var info = val.someObject.someMethod.getData(0);
        notEqual(info, undefined, 'returns an object');
    });
    test('and the object that getData(n) returns exposes and api', function(val){
        var info = val.someObject.someMethod.getData(0);
        equal(info.argsPassed[0], 'Tell me something about JavaScript', 'and calling argsPassed[n] returns the arguments that were passed to the method');
        equal(info.returned, 'JavaScript is amazing!', 'and calling returned() returns what the function returned');
        isTrue(info.context === val.someObject, 'and calling context() returns the context the function was called with');
    });
});

group('When snooping on a method', function(){
    beforeEachTest(function(val){
        val.foo = {
            someFn: function(arg){
                return arg;
            }
        };
    });
    test('then querying if the method was called', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.wasCalled(), 'returns true');
    });
    test('then querying how many times the method was called', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        equal(foo.someFn.called(), 1, 'returns the number of times method was called');
    });
    test('then querying if the method was called n times', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.wasCalled.nTimes(1), 'returns true if called n times');
        isFalse(foo.someFn.wasCalled.nTimes(2), 'returns false if not called n times');
    });
    test('then querying the context the method was called with', function(val){
        var foo = val.foo,
            bar = {};
        snoop(foo, 'someFn');
        foo.someFn();
        equal(foo.someFn.contextCalledWith(), foo, 'returns it was called with foo');
        notEqual(foo.someFn.contextCalledWith(), bar, 'returns it was not called with bar');
    });
    test('then querying for the arguments that the method was called with', function(val){
        var foo = val.foo,
            arg = 'Preamble rocks!';
        snoop(foo, 'someFn');
        foo.someFn(arg);
        equal(foo.someFn.args.getArgument(0), arg, 'confirms it was passed "Preamble rocks!"');
        notEqual(foo.someFn.args.getArgument(0), arg + '!', 'confirms it was not passed "Preamble rocks!!"');
        isNotTruthy(foo.someFn.args.getArgument(1), 'confirms that 2 arguments were not passed to the method');
    });
    test('then we can query for what the method returned', function(val){
        var foo = val.foo,
            arg = 'Preamble rocks!';
        snoop(foo, 'someFn');
        foo.someFn(arg);
        equal(foo.someFn.returned(), arg, 'confirms it returned arg');
        notEqual(foo.someFn.returned(), arg + '!', 'confirms it did not return arg + "!"');
    });
});

group('When a snooped method throws', function(){
    beforeEachTest(function(val){
        val.foo = {
            someFn: function(){
                throw new Error('Holy Batman!');
            }
        };
    });
    test('then we can query the method it threw', function(val){
        var foo = val.foo;
        snoop(foo, 'someFn');
        foo.someFn();
        isTrue(foo.someFn.threw(), 'it did throw');
        isTrue(foo.someFn.threw.withMessage('Holy Batman!'), 'has a specific message');
        isFalse(foo.someFn.threw.withMessage('Holy Batman!!'), 'does not have a specific message');
    });
});

group('When snooping on more than one method', function(){
    beforeEachTest(function(val){
        val.foo = {
            someFn: function(arg){
                return arg;
            }
        };
        val.bar = {
            someFn: function(arg){
                return arg;
            }
        };
    });
    test('then snoops are isolated and there are no side effects', function(val){
        var foo = val.foo,
            bar = val.bar;
        snoop(foo, 'someFn');
        snoop(bar, 'someFn');
        foo.someFn('Is Preamble great?');
        bar.someFn('Yes it is!');
        foo.someFn('You got that right!');
        isTrue(foo.someFn.wasCalled(), 'foo.someFn was called');
        isTrue(foo.someFn.wasCalled.nTimes(2), 'foo.someFn was called n times');
        isFalse(foo.someFn.wasCalled.nTimes(1), 'foo.someFn was not called n times');
        isTrue(bar.someFn.wasCalled(), 'bar.someFn was called');
        isTrue(bar.someFn.wasCalled.nTimes(1), 'bar.someFn was called n times');
        isFalse(bar.someFn.wasCalled.nTimes(2), 'bar.someFn was not called n times');
    });
});

group('When the "calls" api is used', function(){
    var i, 
        foo = {
            someFn: function(arg){
                return arg;
            }
        },
        bar ={},
        n = 3,
        aCall;
    snoop(foo, 'someFn');
    for(i = 0; i < n; i++){
        foo.someFn(i) ;
    }
    test('then count() returns', function(){
        equal(foo.someFn.calls.count(), n, 'the correct count');
    });
    test('then all() returns', function(){
        equal(foo.someFn.calls.all().length, n, 'an array with the right number of elements');
    });
    test('then forCall(n) returns the correct element', function(){
        for(i = 0; i < n; i++){
            aCall = foo.someFn.calls.forCall(i);
            equal(aCall.context, foo, 'context is foo');
            notEqual(aCall.context, bar, 'context is bar');
            equal(aCall.args[0], i, 'args[0] is ' + i);
            notEqual(aCall.args[0], n, 'args[0] is ' + n);
            isNotTruthy(aCall.error, 'there was no error');
            equal(aCall.returned, i, 'returned ' + i);
            notEqual(aCall.returned, n, 'returned ' + n);
        }
    });
});
